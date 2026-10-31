using System.ComponentModel.DataAnnotations;
using Projetos___4.Domain.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Service;

namespace Projetos___4.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HostController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IHostAppService _hostAppService;
        private readonly JwtTokenService _tokenService;
        private readonly IHostStatisticsAppService _hostStatisticsAppService;

        public HostController(UserManager<User> userManager, IHostAppService hostAppService, JwtTokenService tokenService,
            IHostStatisticsAppService hostStatisticsAppService)
        {
            _userManager = userManager;
            _hostAppService = hostAppService;
            _tokenService = tokenService;
            _hostStatisticsAppService = hostStatisticsAppService;
        }

        [Authorize (Roles ="ADMIN,HOST")]
        [HttpGet("{hostId:int}/Statistics/Summary")]
        public async Task<IActionResult> StatisticsSummary([FromRoute] int hostId, [FromQuery] HostStatisticsFilterDTO dto)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                return Ok(await _hostStatisticsAppService.GetSummaryAsync(hostId, userId, dto));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Usuário não autenticado", detail: ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound, title: "Host indisponível", detail: ex.Message);
            }
            catch (StatisticsForbiddenException ex)
            {
                return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Acesso às estatísticas indisponível", detail: ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Período inválido", detail: ex.Message);
            }
        }

        [Authorize (Roles ="ADMIN,HOST")]
        [HttpGet("{hostId:int}/Statistics/Ranking")]
        public async Task<IActionResult> StatisticsRanking([FromRoute] int hostId, [FromQuery] HostStatisticsRankingFilterDTO dto)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                return Ok(await _hostStatisticsAppService.GetRankingAsync(hostId, userId, dto));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Usuário não autenticado", detail: ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound, title: "Host indisponível", detail: ex.Message);
            }
            catch (StatisticsForbiddenException ex)
            {
                return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Acesso às estatísticas indisponível", detail: ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Filtros inválidos", detail: ex.Message);
            }
        }

        [Authorize (Roles = "ADMIN,HOST")]
        [HttpGet("{hostId:int}/Statistics/Daily")]
        public async Task<IActionResult> StatisticsDaily([FromRoute] int hostId, [FromQuery] HostStatisticsFilterDTO dto)
        {
            try
            {
                var userId = _userManager.GetUserId(User);
                return Ok(await _hostStatisticsAppService.GetDailyAsync(hostId, userId, dto));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Usuário não autenticado", detail: ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound, title: "Host indisponível", detail: ex.Message);
            }
            catch (StatisticsForbiddenException ex)
            {
                return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Acesso às estatísticas indisponível", detail: ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Período inválido", detail: ex.Message);
            }
        }

        [Authorize]
        [HttpGet("GetByCNPJ")]
        public async Task<IActionResult> GetByCNPJ([FromQuery] string cnpj)
        {
            try
            {
                return Ok(await _hostAppService.GetByCnpjAsync(cnpj, HttpContext.RequestAborted));
            }
            catch (CnpjException ex)
            {
                return ex.CnpjProblem(this);
            }
        }

        [Authorize]
        [HttpGet("Details/{hostId:int}")]
        public async Task<IActionResult> Details([FromRoute, Range(1, int.MaxValue)] int hostId)
        {

            var host = await _hostAppService.GetByIdAsync(hostId);

            if (host == null)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound,
                    title: "Host indisponível", detail: "Host não encontrado ou inativo.");
            }

            return Ok(host);
        }

        [HttpPost("Create")]
        [Authorize]

        public async Task<IActionResult> Create([FromBody] HostDTO dto)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Autenticação inválida", detail: "User is not authenticated");
            }

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null || !user.IsActive)
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Autenticação inválida", detail: "Usuário não encontrado ou inativo.");
            }

            HostCreatedDTO? result;
            try
            {
                result = await _hostAppService.Create(dto, userId);
            }
            catch (CnpjException ex)
            {
                return ex.CnpjProblem(this);
            }
            catch (GeocodingException ex)
            {
                return Problem(statusCode: ex.ServiceUnavailable
                        ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status422UnprocessableEntity,
                    title: ex.ServiceUnavailable ? "Serviço de localização indisponível" : "Endereço não localizado",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex) when (ex.Message == "Role HOST is not registered." ||
                ex.Message == "Failed to create host." || ex.Message == "Host role assignment failed.")
            {
                return Problem(statusCode: StatusCodes.Status500InternalServerError,
                    title: "Falha no cadastro do host",
                    detail: ex.Message == "Host role assignment failed."
                        ? "Não foi possível atribuir a permissão HOST. O cadastro do host foi desfeito."
                        : "Não foi possível concluir o cadastro do host.");
            }

            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: ex.Message);
            }
            if (result == null)
            {
                return Problem(statusCode: StatusCodes.Status500InternalServerError, title: "Falha no cadastro do host");
            }


            var auth = await _tokenService.CreateAsync(user);

            return StatusCode(StatusCodes.Status201Created, new { result, auth });
        }


        [Authorize(Roles = "ADMIN,HOST")]
        [HttpPut("{hostId:int}/Edit")]
        public async Task<IActionResult> Edit([FromRoute, Range(1, int.MaxValue)] int hostId, [FromBody] HostDTO dto)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuário não autenticado");
            }


            if (dto == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: "Informe os dados da requisição.");
            }

            HostResponseDTO? result;
            try
            {
                result = await _hostAppService.EditHostAsync(dto, hostId, userId);
            }
            catch (CnpjException ex)
            {
                return ex.CnpjProblem(this);
            }
            catch (GeocodingException ex)
            {
                return Problem(statusCode: ex.ServiceUnavailable
                        ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status422UnprocessableEntity,
                    title: ex.ServiceUnavailable ? "Serviço de localização indisponível" : "Endereço não localizado",
                    detail: ex.Message);
            }


            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: ex.Message);
            }
            if (result == null)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound,
                    title: "Host indisponível",
                    detail: "Host não encontrado ou indisponível para este usuário.");
            }

            return Ok(result);
        }

        [Authorize(Roles = "ADMIN,HOST")]
        [HttpPatch("{hostId:int}/Delete")]
        public async Task<IActionResult> Delete([FromRoute, Range(1, int.MaxValue)] int hostId)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuário não autenticado");
            }


            var result = await _hostAppService.DeleteHostAsync(hostId, userId);

            if (result == null)
            {
                return Problem(statusCode: StatusCodes.Status404NotFound,
                    title: "Host indisponível",
                    detail: "Host não encontrado ou indisponível para este usuário.");
            }

            return NoContent();
        }

        [Authorize(Roles = "ADMIN,HOST")]
        [HttpGet("GetAllHostsbyUserId")]
        public async Task<IActionResult> GetAllHostsbyUserId()
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Autenticação inválida", detail: "Usuário não autenticado.");
            }

            IEnumerable<HostResponseDTO> hostlist = await _hostAppService.GetAllHostsbyUserId(userId);

            return Ok(hostlist);
        }
        [Authorize]
        [HttpGet("HostFilter")]
        public async Task<IActionResult> FilterAsync([FromQuery] HostFilterDTO dto)
        {
            try
            {
                var hostlist = await _hostAppService.FilterAsync(dto);
                return Ok(hostlist);
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Filtros inválidos", detail: ex.Message);
            }
        }
    }
}
