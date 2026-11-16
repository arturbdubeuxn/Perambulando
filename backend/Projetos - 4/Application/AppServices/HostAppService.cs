using Projetos___4.Application.DTO.HostsPhoto;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.Validations.Interfaces;
using Projetos___4.Application.Interfaces;
using System.Net.WebSockets;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Application.DTO.Host;
using Projetos___4.Application.DTO.OpeningDays;
using Projetos___4.Application.DTO.Company;

namespace Projetos___4.Application.AppServices
{
    public class HostAppService : IHostAppService
    {
        private readonly IValidation<OpeningWeekDTO> _openingWeekValidation;
        private readonly IValidation<HostDTO> _hostValidation;
        private readonly IHostService _hostService;
        private readonly IProgrammingService _programmingService;
        private readonly IAddressAppService _addressAppService;
        private readonly IHostMapping _hostMapping;
        private readonly IHostFilterMapping _hostFilterMapping;
        private readonly IHostsPhotosService _hostsPhotosService;
        private readonly IHostsPhotosMapping _hostsPhotosMapping;
        public HostAppService(IHostService hostService, IProgrammingService programmingService, IAddressAppService addressAppService, IValidation<HostDTO> hostValidation, IHostMapping hostMapping, IHostFilterMapping hostFilterMapping, IValidation<OpeningWeekDTO> openingWeekValidation, IHostsPhotosService hostsPhotosService, IHostsPhotosMapping hostsPhotosMapping)
        {
            _openingWeekValidation = openingWeekValidation;
            _hostsPhotosService = hostsPhotosService;
            _hostsPhotosMapping = hostsPhotosMapping;
            _hostMapping = hostMapping;
            _hostValidation = hostValidation;
            _hostService = hostService;
            _programmingService = programmingService;
            _addressAppService = addressAppService;
            _hostFilterMapping = hostFilterMapping;
        }

        public async Task<List<HostPhotoResponse>> GetAllHostsPhotosByHost(int hostId)
        {
            var photos = await _hostsPhotosService.GetAllAsync(hostId);
            return photos.Select(photo => _hostsPhotosMapping.ToDTO(photo)).ToList();
        }
        public async Task<HostPhotoResponse> CreateHostPhotoAsync(HostPhotoCreateDTO dto, string userId)
        {
            var photo = _hostsPhotosMapping.ToModel(dto);
            var result = await _hostsPhotosService.CreateAsync(photo, userId);
            return _hostsPhotosMapping.ToDTO(result);
        }
        public Task DeleteHostPhotoAsync(int photoId, string userId)
        {
            return _hostsPhotosService.DeleteAsync(photoId, userId);
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
            if (dto.OpeningWeek != null)
            {
                _openingWeekValidation.Validate(dto.OpeningWeek, DateTime.UtcNow);
            }
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
            if (dto.OpeningWeek != null)
            {
                throw new ArgumentException("Utilize o endpoint de funcionamento para editar os horários do host.");
            }
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

        public async Task<List<HostResponseDTO>> FilterAsync(HostFilterDTO dto)
        {
            var model = _hostFilterMapping.ToModel(dto);
            var hosts = await _hostService.FilterAsync(model);
            return hosts.Select(_hostMapping.ToDTO).ToList();
        }
    }
}

