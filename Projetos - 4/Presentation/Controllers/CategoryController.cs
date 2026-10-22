using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.AppServices;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Model;

namespace Projetos___4.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoryController : ControllerBase
{
    private readonly ICategoryAppService _categoryAppService;
    private readonly IUserXCategoryAppService _userXCategoryAppService;
    private readonly UserManager<User> _userManager;

    public CategoryController(ICategoryAppService categoryAppService, IUserXCategoryAppService userXCategoryAppService, UserManager<User> userManager)
    {
        _categoryAppService = categoryAppService;
        _userXCategoryAppService = userXCategoryAppService;
        _userManager = userManager;
    }

    [AllowAnonymous]
    [HttpGet("GetallCategories")]
    public async Task<IActionResult> GetallCategories()
    {
        var categories = await _categoryAppService.GetallCategories();
        return Ok(categories);
    }

    [Authorize]
    [HttpGet("GetUserCategoriesPreferences")]
    public async Task<IActionResult> GetUserCategoriesPreferences()
    {
        var userId = _userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized,
                title: "Usuário não autenticado");
        }

        var categories = await _categoryAppService.GetAllCategoriesPrefereces(userId);

        return Ok(categories);
    }

    [Authorize]
    [HttpPost("AddCategoryToUser")]
    public async Task<IActionResult> AddCategoryToUser(List<int> categoryIds)
    {
        var userId = _userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized,
                title: "Usuário não autenticado");
        }

        var dto = new UserXCategoryDTO
        {
            UserId = userId,
            CategoryIds = categoryIds
        };

        List<UserXCategory> result;
        try
        {
            result = await _userXCategoryAppService.AddCategoryToUserAsync(dto);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest,
                title: "Categorias inválidas", detail: ex.Message);
        }
        if (result == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest,
                title: "Erro ao adicionar categoria",
                detail: "Não foi possível adicionar a categoria ao usuário.");
        }
        return Ok(new { message = "Categorias adicionadas com sucesso." });
    }

    [Authorize]
    [HttpPut("EditCategoryToUser")]
    public async Task<IActionResult> EditCategoryToUser([FromBody] List<int> categoryIds)
    {
        var userId = _userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized,
                title: "Usuário não autenticado");
        }

        if (categoryIds == null || categoryIds.Any(id => id <= 0))
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Categorias inválidas",
                Detail = "Informe uma lista com IDs maiores que zero, ou [] para remover todas as preferências."
            });
        }

        var dto = new UserXCategoryDTO
        {
            UserId = userId,
            CategoryIds = categoryIds
        };

        List<UserXCategory> links;
        try
        {
            links = await _userXCategoryAppService.EditCategoryToUserAsync(dto);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest,
                title: "Categorias inválidas", detail: ex.Message);
        }
        return Ok(links);
    }

}
