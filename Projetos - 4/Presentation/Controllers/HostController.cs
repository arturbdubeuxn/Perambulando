using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Service;

namespace Projetos___4.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HostController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IHostAppService _hostAppService;
        private readonly JwtTokenService _tokenService;

        public HostController(UserManager<User> userManager, IHostAppService hostAppService, JwtTokenService tokenService)
        {
            _userManager = userManager;
            _hostAppService = hostAppService;
            _tokenService = tokenService;
        }

        [HttpPost("Create")]
        [Authorize]

        public async Task<IActionResult> Create([FromBody] HostRegisterDTO dto)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized("User is not authenticated");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || !user.IsActive)
                return Unauthorized("Usuário não encontrado ou inativo.");

            var result =  await _hostAppService.Create(dto, userId);
            
            if(!result.Succeeded)
            {
                return BadRequest(result.Message);
            }


            var auth = await _tokenService.CreateAsync(user);

            return Ok(new { host = result.Data, auth });
        }


        [Authorize(Roles = "ADMIN,HOST")]
        [HttpGet("GetAllHostsbyUserId")]
        public async Task<IActionResult> GetAllHostsbyUserId()
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized("Usuário não autenticado.");
            }

            IEnumerable<Hosts> hostlist = await _hostAppService.GetAllHostsbyUserId(userId);

            return Ok(hostlist);
        }
    }
}
