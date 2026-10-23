using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Projetos___4.Domain.Model;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Service;
using Projetos___4.Application.AppServices;

namespace Projetos___4.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IUserAppService _userAppService;
        private readonly JwtTokenService _tokenService;
        private readonly SignInManager<User> _signInManager;
        private readonly IUserXCategoryAppService _userXCategoryAppService;
        private readonly IProgrammingAppService _programmingAppService;

        public UserController(UserManager<User> userManager, IUserAppService userAppService, JwtTokenService tokenService, SignInManager<User> signInManager, IUserXCategoryAppService userXCategoryAppService, IProgrammingAppService programmingAppService)
        {
            _userManager = userManager;
            _userAppService = userAppService;
            _tokenService = tokenService;
            _signInManager = signInManager;
            _userXCategoryAppService = userXCategoryAppService;
            _programmingAppService = programmingAppService;
        }
        [HttpPost("auth/Register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDTO dto)
        {
            if (dto == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "O usuário é inválido");
            }

            IdentityResult result;
            try
            {
                result = await _userAppService.Create(dto);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: ex.Message);
            }

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                    ModelState.AddModelError(error.Code, error.Description);
                return ValidationProblem(ModelState);
            }

            return StatusCode(StatusCodes.Status201Created, new { message = "Usuário cadastrado com sucesso." });

        }
        [HttpPost("auth/Login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDTO dto)
        {
            if (dto == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "Inválido");
            }

            var existingUser = await _userManager.FindByEmailAsync(dto.Email);

            if (existingUser == null || !existingUser.IsActive)
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Autenticação inválida", detail: "E-mail ou senha inválidos.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(existingUser, dto.Password, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Autenticação inválida", detail: "E-mail ou senha inválidos.");
            }

            return Ok(await _tokenService.CreateAsync(existingUser));
        }

        [Authorize]
        [HttpGet("Profile")]
        public async Task<IActionResult> Profile()
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuário não autenticado");
            }

            var profile = await _userAppService.GetProfileAsync(userId);

            if (profile == null)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound,
                    title: "Usuário indisponível",
                    detail: "Usuário não encontrado ou inativo.");
            }

            return Ok(profile);
        }

        [Authorize]
        [HttpPut("Edit")]
        public async Task<IActionResult> Edit([FromBody] UserEditDTO dto)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuário não autenticado");
            }

            if (dto == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: "Informe os dados da requisição.");
            }
            IdentityResult? result;
            try
            {
                result = await _userAppService.EditUserAsync(dto, userId);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: ex.Message);
            }

            if (result == null)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound,
                    title: "Usuário indisponível",
                    detail: "Usuário não encontrado ou inativo.");
            }

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(error.Code, error.Description);
                }

                return ValidationProblem(ModelState);
            }

            var profile = await _userAppService.GetProfileAsync(userId);
            var user = await _userManager.FindByIdAsync(userId);

            if (profile == null || user == null || !user.IsActive)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound,
                    title: "Usuário indisponível",
                    detail: "Usuário não encontrado ou inativo.");
            }

            var auth = await _tokenService.CreateAsync(user);

            return Ok(new { user = profile, auth });
        }

        [Authorize]
        [HttpDelete]
        public async Task<IActionResult> DeleteUser([FromBody] UserDeleteDTO dto)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Usuário não autenticado");
            }

            if (dto == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: "Informe os dados da requisição.");
            }
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);

            if (existingUser != null && existingUser.Id != userId)
            {
                return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Acesso negado", detail: "Você só pode excluir a própria conta.");
            }

            if (existingUser == null)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound, title: "Usuário não encontrado");
            }

            var result = await _userManager.DeleteAsync(existingUser);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                    ModelState.AddModelError(error.Code, error.Description);
                return ValidationProblem(ModelState);
            }

            return NoContent();
        }

    }
}
