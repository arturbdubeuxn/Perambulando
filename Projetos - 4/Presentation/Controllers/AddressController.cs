using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.Interfaces;
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
    [HttpGet("GetAllAddress")]
    [Authorize]
    public async Task<IActionResult> GetAllAddress([FromQuery] string? search = null)
    {
        var addresses = await _addressAppService.GetAllAddressAsync(search ?? string.Empty);
        return Ok(addresses);
    }
}
