using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO.Roadmap;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Model;

namespace Projetos___4.Presentation.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RoadmapController : ControllerBase
    {
        private readonly IRoadmapAppService _roadmapAppService;
        private readonly UserManager<User> _userManager;

        public RoadmapController(IRoadmapAppService roadmapAppService, UserManager<User> userManager)
        {
            _roadmapAppService = roadmapAppService;
            _userManager = userManager;
        }
        [AllowAnonymous]
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] RoadmapCreateDTO dto)
        {
            try
            {
                var result = await _roadmapAppService.CreateRoadmapAsync(dto, _userManager.GetUserId(User));
                return CreatedAtAction(nameof(Details), new { roadmapId = result.Id }, result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: 403, title: "Acesso ao roteiro negado", detail: ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: 400, title: "Dados inválidos", detail: ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(statusCode: 404, title: "Roteiro ou destino indisponível", detail: ex.Message);
            }
        }
        [AllowAnonymous]
        [HttpGet("Details/{roadmapId:int}")]
        public async Task<IActionResult> Details([FromRoute] int roadmapId)
        {
            try
            {
                return Ok(await _roadmapAppService.GetRoadmapByIdAsync(roadmapId));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: 403, title: "Acesso ao roteiro negado", detail: ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: 400, title: "Dados inválidos", detail: ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(statusCode: 404, title: "Roteiro ou destino indisponível", detail: ex.Message);
            }
        }
        [HttpGet("GetAllRoadmapsByUserId")]
        [Authorize]
        public async Task<IActionResult> GetAllRoadmapsByUserId()
        {
            try
            {
                return Ok(await _roadmapAppService.GetAllRoadmapsByUserIdAsync(_userManager.GetUserId(User)!));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: 403, title: "Acesso ao roteiro negado", detail: ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: 400, title: "Dados inválidos", detail: ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(statusCode: 404, title: "Roteiro ou destino indisponível", detail: ex.Message);
            }
        }
        [HttpPut("{roadmapId:int}/Edit")]
        [Authorize]
        public async Task<IActionResult> Edit([FromRoute] int roadmapId, [FromBody] RoadmapCreateDTO dto)
        {
            try
            {
                return Ok(await _roadmapAppService.UpdateRoadmapAsync(roadmapId, dto, _userManager.GetUserId(User)!));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: 403, title: "Acesso ao roteiro negado", detail: ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: 400, title: "Dados inválidos", detail: ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(statusCode: 404, title: "Roteiro ou destino indisponível", detail: ex.Message);
            }
        }
        [HttpPatch("{roadmapId:int}/Delete")]
        [Authorize]
        public async Task<IActionResult> Delete([FromRoute] int roadmapId)
        {
            try
            {
                var deleted = await _roadmapAppService.DeleteRoadmapAsync(roadmapId, _userManager.GetUserId(User)!);
                return deleted ? NoContent() : NotFound();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: 403, title: "Acesso ao roteiro negado", detail: ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: 400, title: "Dados inválidos", detail: ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(statusCode: 404, title: "Roteiro ou destino indisponível", detail: ex.Message);
            }
        }
    }
}

