using Projetos___4._2___Application.DTO;
using Projetos___4.Application.Interfaces;
using System.Net.WebSockets;
using Projetos___4._3___Domain.Model;
using Projetos___4.Domain.Interfaces.Service;

namespace Projetos___4.Application.AppServices
{
    public class HostAppService : IHostAppService
    {
        private readonly IHostService _hostService;
        public HostAppService(IHostService hostService)
        {
            _hostService = hostService;
        }

        public async Task<OperationResult<HostRegisterDTO>> Create(HostRegisterDTO dto, string userId)
        {
            if(dto == null || string.IsNullOrEmpty(userId))
            {
                return new OperationResult<HostRegisterDTO>(false, null, "Invalid input data.");
            }

            var host = new Hosts
            {
                Typeofhost = dto.Typeofhost,
                CNPJ = dto.CNPJ,
                LogoUrl = dto.LogoUrl,
                InstagranUrl = dto.InstagranUrl,
                Address = dto.Address,
                Neighborhood = dto.Neighborhood,
                CEP = dto.CEP,
                Phone = dto.Phone,
                Name = dto.Name,
                Description = dto.Description,
            };

            var result = await _hostService.Create(host, userId);

            return new OperationResult<HostRegisterDTO>(result.Succeeded,
                result.Succeeded ? dto : null, result.Message);



        }
    }
}
