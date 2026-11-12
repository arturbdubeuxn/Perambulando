using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO.Roadmap;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Model.User;

namespace Projetos___4.Presentation.Controllers
{
    [AllowAnonymous]
    [Route("api/[controller]")]
    [ApiController]
    public class RoadmapController : Controller
    {
        private readonly IRoadmapAppService _roadmapAppService;
        private readonly UserManager<User> _userManager;

        public RoadmapController(IRoadmapAppService roadmapAppService, UserManager<User> userManager)
        {
            _roadmapAppService = roadmapAppService;
            _userManager = userManager;
        }

        [HttpPost("Create")]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] RoadmapDTO dto)
        {
            var userId = _userManager.GetUserId(User);

            try
            {
                return Created("", await _roadmapAppService.Create(dto, userId));
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: 400, title: "Dados inválidos", detail: ex.Message);
            }
            catch (TravelChatInterpretationException ex)
            {
                return Problem(statusCode: ex.ServiceUnavailable ? 503 : 502,
                    title: ex.ServiceUnavailable ? "Interpretação indisponível" : "Resposta de interpretação inválida",
                    detail: ex.Message);
            }
        }
    }
}
