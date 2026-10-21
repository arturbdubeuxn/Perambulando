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
        private readonly IAddressAppService _addressAppService;

        public HostAppService(IHostService hostService, IProgrammingService programmingService, IAddressAppService addressAppService)
        {
            _hostService = hostService;
            _programmingService = programmingService;
            _addressAppService = addressAppService;
        }

        public async Task<HostDetailsDTO?> GetByIdAsync(int hostId)
        {
            var host = await _hostService.GetByIdAsync(hostId);

            if (host == null)
            {
                return null;
            }

            var programmings = await _programmingService.GetAllProgrammingsbyHostId(hostId);

            var address = host.Address;

            return new HostDetailsDTO
            {
                Id = host.Id,
                Name = host.Name,
                Description = host.Description,
                Typeofhost = host.Typeofhost,
                CNPJ = host.CNPJ,
                LogoUrl = host.LogoUrl,
                InstagranUrl = host.InstagranUrl,
                AddressId = host.AddressId,
                Address = new AddressDetailsDTO
                {
                    Id = address.Id,
                    Street = address.Street,
                    Number = address.Number,
                    Complement = address.Complement,
                    Neighborhood = address.Neighborhood,
                    CEP = address.CEP
                },
                Phone = host.Phone,
                Programmings = programmings.Select(programming => new ProgrammingDetailsDTO
                {
                    Id = programming.Id,
                    HostId = programming.HostId,
                    Name = programming.Name,
                    Description = programming.Description,
                    StartDate = programming.StartDate,
                    EndDate = programming.EndDate,
                    IsFree = programming.IsFree,
                    AddressId = programming.AddressId,
                    Address = new AddressDetailsDTO
                    {
                        Id = programming.Address.Id,
                        Street = programming.Address.Street,
                        Number = programming.Address.Number,
                        Complement = programming.Address.Complement,
                        Neighborhood = programming.Address.Neighborhood,
                        CEP = programming.Address.CEP
                    },
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
                AddressId = dto.AddressId ?? 0,
                Phone = dto.Phone,
                Name = dto.Name,
                Description = dto.Description,
            };

            if (dto.Address != null)
            {
                host.Address = new Address
                {
                    Street = dto.Address.Street,
                    Number = dto.Address.Number,
                    Complement = dto.Address.Complement ?? string.Empty,
                    Neighborhood = dto.Address.Neighborhood ?? string.Empty,
                    CEP = dto.Address.CEP
                };
            }

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
                AddressId = dto.AddressId ?? 0,
                Phone = dto.Phone,
                Name = dto.Name,
                Description = dto.Description
            };

            if (dto.Address != null)
            {
                host.Address = new Address
                {
                    Street = dto.Address.Street,
                    Number = dto.Address.Number,
                    Complement = dto.Address.Complement ?? string.Empty,
                    Neighborhood = dto.Address.Neighborhood ?? string.Empty,
                    CEP = dto.Address.CEP
                };
            }

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
