using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Model;

namespace Projetos___4.Presentation.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AddressController : Controller 
{
    private readonly IAddressAppService _addressAppService;
    public AddressController(IAddressAppService addressAppService)
    {
        _addressAppService = addressAppService;
    }
    [HttpGet("GetByCEP")]
    public async Task<IActionResult> GetByCEP([FromQuery] string cep)
    {
        try
        {
            var address = await _addressAppService.GetByCEPAsync(cep, HttpContext.RequestAborted);
            if (address == null)
            {
                return Problem(statusCode: 404, title: "CEP não encontrado", detail: "Confira o CEP informado.");
            }
            return Ok(address);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: 400, title: "CEP inválido", detail: ex.Message);
        }
        catch (PostalCodeException ex)
        {
            return Problem(statusCode: 503, title: "Consulta de CEP indisponível", detail: ex.Message);
        }
    }

    [HttpGet("GetAllAddress")]
    [Authorize]
    public async Task<IActionResult> GetAllAddress([FromQuery] string? search = null)
    {
        var addresses = await _addressAppService.GetAllAddressAsync(search ?? string.Empty);
        return Ok(addresses);
    }
}
