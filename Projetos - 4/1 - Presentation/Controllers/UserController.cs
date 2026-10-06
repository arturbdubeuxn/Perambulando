using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4._3___Domain.Model;
using Projetos___4._2___Application.DTO;

namespace Projetos___4._1___Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public UserController(UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }
        [HttpPost("auth/Register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDTO dto)
        {
            if (dto == null)
            {
                return BadRequest("O usuário é inválido");
            }

            var newUser = new User
            {
                UserName = dto.Name,
                Email = dto.Email,
                Typeofuser = (User.TypeofUser)dto.TypeofUser,
            };

            var result = await _userManager.CreateAsync(newUser, dto.Password);


            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok("User registered successfully");

        }
        [HttpPost("auth/Login")]
        public async Task<IActionResult> Login([FromBody] UserRegisterDTO dto)
        {
            if (dto == null)
            {
                return BadRequest("Inválido");
            }

            var existingUser = await _userManager.FindByEmailAsync(dto.Email);

            if (existingUser == null)
            {
                return NotFound("Usuário não encontrado");
            }

            return Ok("Usuário logado com sucesso");



        }


        [HttpDelete]
        public async Task<IActionResult> DeleteUser([FromBody] UserRegisterDTO dto)
        {
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);

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
        public IActionResult GetHostDetails()
        {
            return Ok("Host Details: Artur, Age: 30, Location: Earth");
        }

    }
}
