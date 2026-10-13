using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Projetos___4._3___Domain.Model;
using Projetos___4._2___Application.DTO;
using Projetos___4._2___Application.Interfaces;
using Projetos___4._3___Domain.Service;

namespace Projetos___4._1___Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IUserAppService _userAppService;
        private readonly JwtTokenService _tokenService;
        private readonly SignInManager<User> _signInManager;

        public UserController(UserManager<User> userManager, IUserAppService userAppService, JwtTokenService tokenService, SignInManager<User> signInManager)
        {
            _userManager = userManager;
            _userAppService = userAppService;
            _tokenService = tokenService;
            _signInManager = signInManager;
        }
        [HttpPost("auth/Register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDTO dto)
        {
            if (dto == null)
            {
                return BadRequest("O usuário é inválido");
            }
            
            var result = await _userAppService.Create(dto);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok("User registered successfully");

        }
        [HttpPost("auth/Login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDTO dto)
        {
            if (dto == null)
            {
                return BadRequest("Inválido");
            }

            var existingUser = await _userManager.FindByEmailAsync(dto.Email);

            if (existingUser == null || !existingUser.IsActive)
            {
                return Unauthorized("E-mail ou senha inválidos.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(existingUser, dto.Password, lockoutOnFailure: true);
            if (!result.Succeeded)
                return Unauthorized("E-mail ou senha inválidos.");
            return Ok(await _tokenService.CreateAsync(existingUser));



        }


        [HttpDelete]
        [Authorize (Roles = "ADMIN")]
        public async Task<IActionResult> DeleteUser([FromBody] UserRegisterDTO dto)
        {
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);

            if (existingUser != null && existingUser.Id != User.FindFirstValue("sub"))
                return Forbid();

            if (existingUser == null)
            {
                return NotFound("User not found");
            }

            var result = await _userManager.DeleteAsync(existingUser);

            if (!result.Succeeded)
            {
                return BadRequest("Failed to delete user");
            }

            return Ok("User deleted successfully");
        }

        [HttpGet("Artur/Details")]
        [Authorize(Roles = "ADMIN")]
        public IActionResult GetHostDetails()
        {
            return Ok("Host Details: Artur, Age: 30, Location: Earth");
        }

    }
}
