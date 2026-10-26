using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.Validations.Interfaces;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using System.Net.WebSockets;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Interfaces.Service;

namespace Projetos___4.Application.AppServices
{
    public class HostAppService : IHostAppService
    {
        private readonly IValidation<HostDTO> _hostValidation;
        private readonly IHostService _hostService;
        private readonly IProgrammingService _programmingService;
        private readonly IAddressAppService _addressAppService;

        private readonly IHostMapping _hostMapping;

        public HostAppService(IHostService hostService, IProgrammingService programmingService, IAddressAppService addressAppService, IValidation<HostDTO> hostValidation, IHostMapping hostMapping)
        {
            _hostMapping = hostMapping;
            _hostValidation = hostValidation;
            _hostService = hostService;
            _programmingService = programmingService;
            _addressAppService = addressAppService;
        }

        public async Task<CompanyRegistrationDTO> GetByCnpjAsync(string cnpj, CancellationToken cancellationToken = default)
        {
            var company = await _hostService.GetByCnpjAsync(cnpj, cancellationToken);
            return _hostMapping.ToCompanyDTO(company);
        }

        public async Task<HostDetailsDTO?> GetByIdAsync(int hostId)
        {
            var host = await _hostService.GetByIdAsync(hostId);
            if (host == null)
            {
                return null;
            }

            var programmings = await _programmingService.GetAllProgrammingsbyHostId(hostId);
            return _hostMapping.ToDetailsDTO(host, programmings);
        }

        public async Task<HostCreatedDTO?> Create(HostDTO dto, string userId)
        {
            _hostValidation.Validate(dto, DateTime.UtcNow);
            var host = _hostMapping.ToModel(dto);
            var result = await _hostService.Create(host, userId);
            if (result == null)
            {
                throw new InvalidOperationException("Failed to create host.");
            }

            return _hostMapping.ToCreatedDTO(result);
        }

        public async Task<HostResponseDTO?> EditHostAsync(HostDTO dto, int hostId, string userId)
        {
            _hostValidation.Validate(dto, DateTime.UtcNow);
            var host = _hostMapping.ToModel(dto);
            host.Id = hostId;
            var result = await _hostService.EditHostAsync(host, userId);
            if (result == null)
            {
                return null;
            }

            return _hostMapping.ToDTO(result);
        }

        public async Task<HostResponseDTO?> DeleteHostAsync(int hostId, string userId)
        {
            var result = await _hostService.DeleteHostAsync(hostId, userId);
            if (result == null)
            {
                return null;
            }

            return _hostMapping.ToDTO(result);
        }

        public async Task<IEnumerable<HostResponseDTO>> GetAllHostsbyUserId(string userid)
        {
            var hosts = await _hostService.GetAllHostsbyUserId(userid);
            return hosts.Select(_hostMapping.ToDTO).ToList();
        }
    }
}
