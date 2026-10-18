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
        private readonly IHostAppService _hostAppService;
        public ProgrammingController(IProgrammingAppService programmingAppService, IHostAppService hostAppService, UserManager<User> userManager)
        {
            _programmingAppService = programmingAppService;
            _userManager = userManager;
            _hostAppService = hostAppService;
        }


        [AllowAnonymous]
        [HttpGet("Details/{programmingId:int}")]
        public async Task<IActionResult> Details([FromRoute] int programmingId)
        {
            if (programmingId <= 0)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "O ID da programação deve ser maior que zero.");
            }

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
        public async Task<IActionResult> Delete([FromRoute] int hostId, [FromRoute] int programmingId)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Usuário não autenticado");
            }

            if (hostId <= 0 || programmingId <= 0)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "Os IDs do host e da programação devem ser maiores que zero.");
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
        public async Task<IActionResult> Edit([FromRoute] int hostId, [FromRoute] int Programmingid, [FromBody] ProgrammingEditDTO dto)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Usuário não autenticado");
            }

            if (hostId <= 0 || Programmingid <= 0)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "Os IDs do host e da programação devem ser maiores que zero.");
            }

            if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.StartDate.Value >= dto.EndDate.Value)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "A data final deve ser posterior à data inicial.");
            }

            if ((dto.StartDate.HasValue && dto.StartDate.Value.Kind != DateTimeKind.Utc) ||
                (dto.EndDate.HasValue && dto.EndDate.Value.Kind != DateTimeKind.Utc))
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "Informe as datas em UTC, com o sufixo Z.");
            }

            if ((dto.MinPrice.HasValue && (!float.IsFinite(dto.MinPrice.Value) || dto.MinPrice.Value < 0)) ||
                (dto.MaxPrice.HasValue && (!float.IsFinite(dto.MaxPrice.Value) || dto.MaxPrice.Value < 0)))
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "Os preços devem ser valores finitos e não negativos.");
            }

            if (dto.MinPrice > dto.MaxPrice)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "O preço mínimo não pode ser maior que o máximo.");
            }

            if (dto.IsFree == true && (dto.MinPrice != 0 || dto.MaxPrice != 0))
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "Os preços devem ser zero para programações gratuitas.");
            }

            if (dto.categoryIds == null || dto.categoryIds.Count == 0)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Categorias inválidas", detail: "Selecione pelo menos uma categoria para a programação.");
            }

            if (dto.categoryIds.Any(categoryId => categoryId <= 0) || dto.categoryIds.Distinct().Count() != dto.categoryIds.Count)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Categorias inválidas", detail: "Informe IDs de categorias positivos e sem repetição.");
            }

            try
            {
                var result = await _programmingAppService.EditProgrammingAsync(dto, Programmingid, hostId, userId);

                if (result == null)
                {
                    return Problem(statusCode: StatusCodes.Status404NotFound,
                        title: "Programação indisponível",
                        detail: "Programação não encontrada ou indisponível para este usuário e host.");
                }

                return Ok(result);
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException postgres &&
                postgres.SqlState == PostgresErrorCodes.ForeignKeyViolation &&
                postgres.ConstraintName?.Contains("CategoryId", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Categorias inválidas", detail: "Uma ou mais categorias informadas não existem.");
            }
        }

        [Authorize(Roles = "ADMIN, HOST")]
        [HttpPost("{HostId:int}/Create")]
        public async Task<IActionResult> Create([FromRoute] int HostId, [FromBody] ProgrammingCreateDTO dto)
        {
            var userid = _userManager.GetUserId(User);

            if (dto == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "Preencha os campos obrigatórios.");
            }

            if (dto.categoryIds == null || dto.categoryIds.Count == 0)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "Selecione pelo menos uma categoria para a programação.");
            }

            List<int> categoryIds = dto.categoryIds;

            foreach(var categoryId in categoryIds)
            {
                if (categoryId <= 0)
                {
                    return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "Os IDs das categorias devem ser maiores que zero.");
                }
            }

            if (userid == null)
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Usuário não autenticado");
            }

            if (HostId <= 0)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "O host precisa ser válido.");
            }


            if (dto.StartDate >= dto.EndDate || dto.StartDate <= DateTime.UtcNow)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "A data de início não pode ser posterior à data de término ou no passado.");
            }

            if (dto.IsFree != true && (dto.MinPrice < 0 || dto.MaxPrice < 0))
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "O preço mínimo e máximo não podem ser negativos.");
            }

            if (dto.MinPrice < 0 || dto.MaxPrice < 0)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "O preço mínimo e máximo não podem ser negativos.");
            }

            if (dto.IsFree == true && (dto.MinPrice > 0 || dto.MaxPrice > 0))
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "O preço mínimo e máximo devem ser zero para eventos gratuitos.");
            }

            if (dto.MinPrice > dto.MaxPrice)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Dados inválidos", detail: "O preço mínimo não pode ser maior que o preço máximo.");
            }

            try
            {
                var programming = await _programmingAppService.CreateProgrammingAsync(dto, HostId, userid);
                return CreatedAtAction(nameof(Details), new { programmingId = programming.Id }, programming);
            }
            catch (InvalidOperationException ex) when (ex.Message == "Esse usuário não é o dono do host ativo para este programa.")
            {
                return Problem(statusCode: StatusCodes.Status404NotFound,
                    title: "Host indisponível",
                    detail: "Host não encontrado ou indisponível para este usuário.");
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
    }
}
