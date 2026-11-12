using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO.TravelChat;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Model.User;

namespace Projetos___4.Presentation.Controllers;

[AllowAnonymous]
[Route("api/[controller]")]
[ApiController]
public class TravelChatController : ControllerBase
{
    private readonly ITravelChatAppService _travelChatAppService;
    private readonly UserManager<User> _userManager;

    public TravelChatController(ITravelChatAppService travelChatAppService, UserManager<User> userManager)
    {
        _travelChatAppService = travelChatAppService;
        _userManager = userManager;
    }

    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("ProgrammingInteractions")]
    [HttpPost("Messages")]
    public async Task<IActionResult> SendMessage([FromBody] TravelChatMessageDTO dto)
    {
        var userId = _userManager.GetUserId(User);
        if (Request.Headers.ContainsKey("Authorization") && User.Identity?.IsAuthenticated != true)
        {
            return Problem(statusCode: 401, title: "Usuário não autenticado");
        }

        try
        {
            return Ok(await _travelChatAppService.SendMessageAsync(dto, userId, HttpContext.RequestAborted));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Problem(statusCode: 401, title: "Usuário não autenticado", detail: ex.Message);
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
