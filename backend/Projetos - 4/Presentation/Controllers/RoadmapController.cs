using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO.Roadmap;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Model;

namespace Projetos___4.Presentation.Controllers
{
    [AllowAnonymous]
    [Route("api/[controller]")]
    [ApiController]
    public class RoadmapController : Controller
    {
        private readonly ITravelChatAppService _travelChatAppService;
        private readonly UserManager<User> _userManager;

        public RoadmapController(ITravelChatAppService travelChatAppService, UserManager<User> userManager)
        {
            _travelChatAppService = travelChatAppService;
            _userManager = userManager;
        }

        [HttpPost("Create")]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] RoadmapCreateDTO dto)
        {
            var userId = _userManager.GetUserId(User);

            try
            {
                return Created("", await _travelChatAppService.Create(dto, userId, HttpContext.RequestAborted));
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
