using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Model;
namespace Projetos___4.Presentation.Controllers;
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SubscriptionController : ControllerBase
{
    private readonly ISubscriptionAppService _subscriptionAppService;
    private readonly UserManager<User> _userManager;
    public SubscriptionController(ISubscriptionAppService subscriptionAppService, UserManager<User> userManager)
    { _subscriptionAppService = subscriptionAppService; _userManager = userManager; }

    [HttpPost("Activate")]
    public async Task<IActionResult> Activate()
    {
        try
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                throw new UnauthorizedAccessException("Usuário não autenticado.");
            }

            return Ok(await _subscriptionAppService.ActivateAsync(userId));
        }
        catch (UnauthorizedAccessException ex)
        { return Problem(statusCode: 401, title: "Usuário não autenticado", detail: ex.Message); }
        catch (InvalidOperationException ex) when (ex.Message == "A ativação simulada do Pro está desabilitada.")
        { return Problem(statusCode: 403, title: "Ativação indisponível", detail: ex.Message); }
    }
    [HttpGet("MySubscription")]
    public async Task<IActionResult> MySubscription()
    {
        try
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                throw new UnauthorizedAccessException("Usuário não autenticado.");
            }

            return Ok(await _subscriptionAppService.GetAsync(userId));
        }
        catch (UnauthorizedAccessException ex)
        { return Problem(statusCode: 401, title: "Usuário não autenticado", detail: ex.Message); }
    }
    [HttpPatch("Cancel")]
    public async Task<IActionResult> Cancel()
    {
        try
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                throw new UnauthorizedAccessException("Usuário não autenticado.");
            }

            return Ok(await _subscriptionAppService.CancelAsync(userId));
        }
        catch (UnauthorizedAccessException ex)
        { return Problem(statusCode: 401, title: "Usuário não autenticado", detail: ex.Message); }
    }
}
