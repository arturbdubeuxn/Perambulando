using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Projetos___4._2___Application.DTO;
using Projetos___4._3___Domain.Model;
using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.Interfaces;

namespace Projetos___4._1___Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HostController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IHostAppService _hostAppService;

        public HostController(UserManager<User> userManager, IHostAppService hostAppService)
        {
            _userManager = userManager;
            _hostAppService = hostAppService;
        }

        [HttpPost("Create")]
        [Authorize]

        public async Task<IActionResult> Create([FromBody] HostRegisterDTO dto)
        {
            var userId = _userManager.GetUserId(User);

            if (userId == null)
            {
                return Unauthorized("User is not authenticated");
            }

            var result =  await _hostAppService.Create(dto, userId);
            
            if(!result.Succeeded)
            {
                return BadRequest(result.Message);
            }


            return Ok(result.Data); ;
        }
        [HttpPost("Read")]
        [Authorize (Roles = "HOST")]
        public async Task<IActionResult> Read()
        {
            return Ok("OK");
        }
    }
}
