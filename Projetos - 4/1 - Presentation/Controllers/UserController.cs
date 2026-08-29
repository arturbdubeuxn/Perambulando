using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4._3___Domain.Model;
using Projetos___4._2___Application.ViewModel;

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
        [HttpGet("auth/Register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDTO user)
        {
            if (user == null)
            {
                return BadRequest("Invalid user data");
            }

            var newUser = new User
            {
                UserName = user.Name,
                Email = user.Email,
                IsActive = user.IsActive
            };

            var result = await _userManager.CreateAsync(newUser, user.Password);

            if (!result.Succeeded)
            {
                return BadRequest("Failed to create user");
            }

            bool roleExists = await _roleManager.RoleExistsAsync(user.TypeofUser);

            if (roleExists)
            {

                await _userManager.AddToRoleAsync(newUser, user.TypeofUser);
                return Ok($"Usuário cadastrado com sucesso e com cargo {user.TypeofUser}");
            }
            else
            {
                return BadRequest("Role does not exist");
            }
        }


        [HttpGet("Artur")]
        public IActionResult GetHostName()
        {
            return Ok("Host Name: Artur");
        }

        [HttpGet("Artur/Details")]
        public IActionResult GetHostDetails()
        {
            return Ok("Host Details: Artur, Age: 30, Location: Earth");
        }

        [HttpPatch("Artur/Update")]
        public IActionResult UpdateHostDetails([FromBody] HostDetails updatedDetails)
        {
            // Here you would typically update the host details in your database or service
            // For demonstration purposes, we'll just return the updated details
            return Ok($"Updated Host Details: Name: {updatedDetails.Name}, Age: {updatedDetails.Age}, Location: {updatedDetails.Location}");
        }
    }
}
