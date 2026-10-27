using System.ComponentModel.DataAnnotations;
using Projetos___4.Domain.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Model;

namespace Projetos___4.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProgrammingController : Controller
    {
        private readonly IProgrammingAppService _programmingAppService;
        private readonly UserManager<User> _userManager;
        public ProgrammingController(IProgrammingAppService programmingAppService, UserManager<User> userManager)
        {
            _programmingAppService = programmingAppService;
            _userManager = userManager;
        }


        [AllowAnonymous]
        [HttpGet("Filter")]
        public async Task<IActionResult> Filter([FromQuery] ProgrammingFilterDTO dto)
        {
            try
            {
                return Ok(await _programmingAppService.FilterAsync(dto));
            }
            catch (ArgumentException ex)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Filtros inválidos",
                    detail: ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpGet("GetAllProgrammings")]
        public async Task<IActionResult> GetAllProgrammings([FromQuery] int take = 10, [FromQuery] int skip = 0)
        {
            try
            {
                var programmings = await _programmingAppService.GetAllProgrammingsAsync(take, skip);
                return Ok(programmings);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Paginação inválida", detail: ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpGet("Details/{programmingId:int}")]
        public async Task<IActionResult> Details([FromRoute, Range(1, int.MaxValue)] int programmingId)
        {

            var programming = await _programmingAppService.GetByIdAsync(programmingId);

            if (programming == null)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound,
                    title: "Programação indisponível",
                    detail: "Programação não encontrada ou indisponível.");
            }

            return Ok(programming);
        }

        [Authorize(Roles = "ADMIN,HOST")]
        [HttpPatch("{hostId:int}/Delete/{programmingId:int}")]
        public async Task<IActionResult> Delete([FromRoute, Range(1, int.MaxValue)] int hostId, [FromRoute, Range(1, int.MaxValue)] int programmingId)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Usuário não autenticado");
            }


            var result = await _programmingAppService.DeleteProgrammingAsync(programmingId, hostId, userId);

            if (result == null)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound,
                    title: "Programação indisponível",
                    detail: "Programação não encontrada ou indisponível para este usuário e host.");
            }

            return NoContent();
        }

        [Authorize(Roles = "ADMIN,HOST")]
        [HttpPut("{hostId:int}/Edit/{Programmingid:int}")]
        public async Task<IActionResult> Edit([FromRoute, Range(1, int.MaxValue)] int hostId, [FromRoute, Range(1, int.MaxValue)] int programmingId, [FromBody] ProgrammingDTO dto)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Usuário não autenticado");
            }

            if (dto == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: "Informe os dados da programação.");
            }

            try
            {
                var result = await _programmingAppService.EditProgrammingAsync(dto, programmingId, hostId, userId);

                if (result == null)
                {
                    return Problem(statusCode: StatusCodes.Status404NotFound,
                        title: "Programação indisponível",
                        detail: "Programação não encontrada ou indisponível para este usuário e host.");
                }

                return Ok(result);
            }
            catch (CategoryLinksConflictException ex)
            {
                return Problem(statusCode: StatusCodes.Status409Conflict,
                    title: "Conflito de categorias", detail: ex.Message);
            }
            catch (GeocodingException ex)
            {
                return Problem(statusCode: ex.ServiceUnavailable
                        ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status422UnprocessableEntity,
                    title: ex.ServiceUnavailable ? "Serviço de localização indisponível" : "Endereço não localizado",
                    detail: ex.Message);
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException postgres &&
                postgres.SqlState == PostgresErrorCodes.ForeignKeyViolation &&
                postgres.ConstraintName?.Contains("CategoryId", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Categorias inválidas", detail: "Uma ou mais categorias informadas não existem.");
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: ex.Message);
            }
        }

        [Authorize(Roles = "ADMIN, HOST")]
        [HttpPost("{HostId:int}/Create")]
        public async Task<IActionResult> Create([FromRoute, Range(1, int.MaxValue)] int hostId, [FromBody] ProgrammingDTO dto)
        {
            var userid = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userid))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Usuário não autenticado");
            }

            if (dto == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: "Informe os dados da requisição.");
            }

            try
            {
                var programming = await _programmingAppService.CreateProgrammingAsync(dto, hostId, userid);
                return CreatedAtAction(nameof(Details), new { programmingId = programming.Id }, programming);
            }
            catch (InvalidOperationException ex) when (ex.Message == "Esse usuário não é o dono do host ativo para este programa.")
            {
                return Problem(statusCode: StatusCodes.Status404NotFound,
                    title: "Host indisponível",
                    detail: "Host não encontrado ou indisponível para este usuário.");
            }
            catch (CategoryLinksConflictException ex)
            {
                return Problem(statusCode: StatusCodes.Status409Conflict,
                    title: "Conflito de categorias", detail: ex.Message);
            }
            catch (GeocodingException ex)
            {
                return Problem(statusCode: ex.ServiceUnavailable
                        ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status422UnprocessableEntity,
                    title: ex.ServiceUnavailable ? "Serviço de localização indisponível" : "Endereço não localizado",
                    detail: ex.Message);
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException postgres &&
                postgres.SqlState == PostgresErrorCodes.ForeignKeyViolation &&
                postgres.ConstraintName?.Contains("CategoryId", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Categorias inválidas", detail: "Uma ou mais categorias informadas não existem.");
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: ex.Message);
            }
        }

        [Authorize]
        [HttpGet("GetUserProgrammingPreferences")]
        public async Task<IActionResult> GetUserProgrammingPreferences()
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuário não autenticado");
            }

            var programmings = await _programmingAppService.GetAllProgrammingsByUserCategoriesAsync(userId);
            return Ok(programmings);
        }
    }
}
