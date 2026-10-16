using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using System.Net.WebSockets;
using Projetos___4.Domain.Model;
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

        public async Task<OperationResult<HostCreatedDTO>> Create(HostRegisterDTO dto, string userId)
        {
            if(dto == null || string.IsNullOrEmpty(userId))
            {
                return new OperationResult<HostCreatedDTO>(false, null, "Invalid input data.");
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

            if (!result.Succeeded || result.Data == null)
                return new OperationResult<HostCreatedDTO>(false, null, result.Message);

            return new OperationResult<HostCreatedDTO>(true,
                new HostCreatedDTO { Id = result.Data.Id, Name = result.Data.Name }, result.Message);



        }

        public async Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userid)
        {
            return await _hostService.GetAllHostsbyUserId(userid);
        }
    }
}
