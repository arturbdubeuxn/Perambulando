using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Model;

namespace Projetos___4.Presentation.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class FavoriteController : ControllerBase
    {
        private readonly IFavoriteAppService _favoriteAppService;
        private readonly UserManager<User> _userManager;

        public FavoriteController(IFavoriteAppService favoriteAppService, UserManager<User> userManager)
        {
            _favoriteAppService = favoriteAppService;
            _userManager = userManager;
        }

        [HttpPost("{programmingId:int}/Create")]
        public async Task<IActionResult> Create([FromRoute] int programmingId)
        {
            try
            {
                return Ok(await _favoriteAppService.AddAsync(_userManager.GetUserId(User), programmingId));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: 401, title: "Usuário não autenticado", detail: ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: 400, title: "Dados inválidos", detail: ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(statusCode: 404, title: "Programação indisponível", detail: ex.Message);
            }
        }

        [HttpGet("GetAllByUserId")]
        public async Task<IActionResult> GetAllByUserId()
        {
            try
            {
                return Ok(await _favoriteAppService.GetAllByUserIdAsync(_userManager.GetUserId(User)));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: 401, title: "Usuário não autenticado", detail: ex.Message);
            }
        }

        [HttpPatch("{programmingId:int}/Delete")]
        public async Task<IActionResult> Delete([FromRoute] int programmingId)
        {
            try
            {
                return Ok(await _favoriteAppService.DeleteAsync(_userManager.GetUserId(User), programmingId));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: 401, title: "Usuário não autenticado", detail: ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: 400, title: "Dados inválidos", detail: ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(statusCode: 404, title: "Favorito indisponível", detail: ex.Message);
            }
        }
    }
}
