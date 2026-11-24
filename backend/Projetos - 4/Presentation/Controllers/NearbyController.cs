using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Application.DTO.NearBy;
namespace Projetos___4.Presentation.Controllers;
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NearbyController : ControllerBase
{
    private readonly INearbyAppService _nearbyAppService;
    private readonly UserManager<User> _userManager;
    public NearbyController(INearbyAppService nearbyAppService, UserManager<User> userManager)
    {
        _nearbyAppService = nearbyAppService;
        _userManager = userManager;
    }    
    [HttpGet("GetNearMe")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNearMe([FromQuery] NearbyUserFilterDTO dto)
    {
        try
        {
            return Ok(await _nearbyAppService.GetNearMeAsync(dto));
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: 400, title: "Consulta inválida", detail: ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Problem(statusCode: 401, title: "Usuário indisponível", detail: ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(statusCode: 404, title: "Destino indisponível", detail: ex.Message);
        }
        catch (NearbyLocationException ex)
        {
            return Problem(statusCode: 422, title: "Localização indisponível", detail: ex.Message);
        }
    }   
    [HttpGet("GetNearProgramming/{programmingId:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNearProgramming([FromRoute] int programmingId, [FromQuery] NearbyDestinationFilterDTO dto)
    {
        try
        {
            return Ok(await _nearbyAppService.GetNearProgrammingAsync(programmingId, dto));
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: 400, title: "Consulta inválida", detail: ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Problem(statusCode: 401, title: "Usuário indisponível", detail: ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(statusCode: 404, title: "Destino indisponível", detail: ex.Message);
        }
        catch (NearbyLocationException ex)
        {
            return Problem(statusCode: 422, title: "Localização indisponível", detail: ex.Message);
        }
    }    
    [HttpGet("GetNearHost/{hostId:int}")]
    [Authorize] 
    public async Task<IActionResult> GetNearHost([FromRoute] int hostId, [FromQuery] NearbyDestinationFilterDTO dto)
    {
        try
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuário não autenticado");
            }
            return Ok(await _nearbyAppService.GetNearHostAsync(hostId, dto));
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: 400, title: "Consulta inválida", detail: ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Problem(statusCode: 401, title: "Usuário indisponível", detail: ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(statusCode: 404, title: "Destino indisponível", detail: ex.Message);
        }
        catch (NearbyLocationException ex)
        {
            return Problem(statusCode: 422, title: "Localização indisponível", detail: ex.Message);
        }
    }
}
