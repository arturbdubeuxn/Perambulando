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

        public HostController(UserManager<User> userManager, IHostAppService hostAppService, JwtTokenService tokenService)
        {
            _userManager = userManager;
            _hostAppService = hostAppService;
            _tokenService = tokenService;
        }

        [Authorize]
        [HttpGet("Details/{hostId:int}")]
        public async Task<IActionResult> Details([FromRoute] int hostId)
        {
            if (hostId <= 0)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: "O ID do host deve ser maior que zero.");
            }

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

        public async Task<IActionResult> Create([FromBody] HostRegisterDTO dto)
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

            Hosts? result;
            try
            {
                result = await _hostAppService.Create(dto, userId);
            }
            catch (GeocodingException ex)
            {
                return Problem(statusCode: ex.ServiceUnavailable
                        ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status422UnprocessableEntity,
                    title: ex.ServiceUnavailable ? "Serviço de localização indisponível" : "Endereço não localizado",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex) when (ex.Message == "Role HOST is not registered." ||
                ex.Message == "Failed to create host." || ex.Message == "Host was saved, but role assignment failed.")
            {
                return Problem(statusCode: StatusCodes.Status500InternalServerError,
                    title: "Falha no cadastro do host",
                    detail: ex.Message == "Host was saved, but role assignment failed."
                        ? "O host foi salvo, mas não foi possível atribuir a permissão HOST. Contate o suporte antes de repetir o cadastro."
                        : "Não foi possível concluir o cadastro do host.");
            }

            if (result == null)
            {
                return Problem(statusCode: StatusCodes.Status500InternalServerError, title: "Falha no cadastro do host");
            }


            var auth = await _tokenService.CreateAsync(user);

            return StatusCode(StatusCodes.Status201Created, new
            {
                host = new HostCreatedDTO
                {
                    Id = result.Id,
                    Name = result.Name
                },
                auth
            });
        }


        [Authorize(Roles = "ADMIN,HOST")]
        [HttpPut("{hostId:int}/Edit")]
        public async Task<IActionResult> Edit([FromRoute] int hostId, [FromBody] HostEditDTO dto)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuário não autenticado");
            }

            if (hostId <= 0)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: "O ID do host deve ser maior que zero.");
            }

            Hosts? result;
            try
            {
                result = await _hostAppService.EditHostAsync(dto, hostId, userId);
            }
            catch (GeocodingException ex)
            {
                return Problem(statusCode: ex.ServiceUnavailable
                        ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status422UnprocessableEntity,
                    title: ex.ServiceUnavailable ? "Serviço de localização indisponível" : "Endereço não localizado",
                    detail: ex.Message);
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
        public async Task<IActionResult> Delete([FromRoute] int hostId)
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuário não autenticado");
            }

            if (hostId <= 0)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Dados inválidos", detail: "O ID do host deve ser maior que zero.");
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

            IEnumerable<Hosts> hostlist = await _hostAppService.GetAllHostsbyUserId(userId);

            return Ok(hostlist);
        }
    }
}
