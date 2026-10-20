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
        private readonly IProgrammingService _programmingService;

        public HostAppService(IHostService hostService, IProgrammingService programmingService)
        {
            _hostService = hostService;
            _programmingService = programmingService;
        }

        public async Task<HostDetailsDTO?> GetByIdAsync(int hostId)
        {
            var host = await _hostService.GetByIdAsync(hostId);

            if (host == null)
            {
                return null;
            }

            var programmings = await _programmingService.GetAllProgrammingsbyHostId(hostId);

            return new HostDetailsDTO
            {
                Id = host.Id,
                Name = host.Name,
                Description = host.Description,
                Typeofhost = host.Typeofhost,
                CNPJ = host.CNPJ,
                LogoUrl = host.LogoUrl,
                InstagranUrl = host.InstagranUrl,
                Address = host.Address,
                AddressNumber = host.AddressNumber,
                AddressComplement = host.AddressComplement,
                Neighborhood = host.Neighborhood,
                CEP = host.CEP,
                Phone = host.Phone,
                Programmings = programmings.Select(programming => new ProgrammingDetailsDTO
                {
                    Id = programming.Id,
                    Name = programming.Name,
                    Description = programming.Description,
                    StartDate = programming.StartDate,
                    EndDate = programming.EndDate,
                    IsFree = programming.IsFree,
                    Address = programming.Address,
                    AddressNumber = programming.AddressNumber,
                    AddressComplement = programming.AddressComplement,
                    Neighborhood = programming.Neighborhood,
                    CEP = programming.CEP,
                    ImageUrl = programming.ImageUrl,
                    TicketUrl = programming.TicketUrl,
                    InstagranUrl = programming.InstagranUrl,
                    HostName = host.Name,
                    HostLogoUrl = host.LogoUrl,
                    CreatedDate = programming.CreatedDate,
                    UpdateDate = programming.UpdateDate,
                    MinPrice = programming.MinPrice,
                    MaxPrice = programming.MaxPrice
                }).ToList()
            };
        }

        public async Task<Hosts?> Create(HostRegisterDTO dto, string userId)
        {
            if(dto == null || string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("Invalid input data.");
            }

            var host = new Hosts
            {
                Typeofhost = dto.Typeofhost,
                CNPJ = dto.CNPJ,
                LogoUrl = dto.LogoUrl,
                InstagranUrl = dto.InstagranUrl,
                Address = dto.Address,
                AddressNumber = dto.AddressNumber,
                AddressComplement = dto.AddressComplement,
                Neighborhood = dto.Neighborhood ?? string.Empty,
                CEP = dto.CEP,
                Phone = dto.Phone,
                Name = dto.Name,
                Description = dto.Description,
            };

            var result = await _hostService.Create(host, userId);

            if (result == null)
                throw new InvalidOperationException("Failed to create host.");

            return result;

        }

        public Task<Hosts?> EditHostAsync(HostEditDTO dto, int hostId, string userId)
        {
            var host = new Hosts
            {
                Id = hostId,
                Typeofhost = dto.Typeofhost!.Value,
                CNPJ = dto.CNPJ,
                LogoUrl = dto.LogoUrl,
                InstagranUrl = dto.InstagranUrl,
                Address = dto.Address,
                AddressNumber = dto.AddressNumber,
                AddressComplement = dto.AddressComplement,
                Neighborhood = dto.Neighborhood ?? string.Empty,
                CEP = dto.CEP,
                Phone = dto.Phone,
                Name = dto.Name,
                Description = dto.Description
            };

            return _hostService.EditHostAsync(host, userId);
        }

        public Task<Hosts?> DeleteHostAsync(int hostId, string userId)
        {
            return _hostService.DeleteHostAsync(hostId, userId);
        }

        public async Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userid)
        {
            return await _hostService.GetAllHostsbyUserId(userid);
        }
    }
}
