using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.Interfaces;

namespace Projetos___4.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoryController : ControllerBase
{
    private readonly ICategoryAppService _categoryAppService;

    public CategoryController(ICategoryAppService categoryAppService)
    {
        _categoryAppService = categoryAppService;
    }

    [AllowAnonymous]
    [HttpGet("GetallCategories")]
    public async Task<IActionResult> GetallCategories()
    {
        var categories = await _categoryAppService.GetallCategories();
        return Ok(categories);
    }
}
