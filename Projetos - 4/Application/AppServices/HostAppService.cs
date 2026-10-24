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
        private readonly IValidation<HostRegisterDTO> _hostCreateValidation;
        private readonly IValidation<HostEditDTO> _hostEditValidation;
        private readonly IHostService _hostService;
        private readonly IProgrammingService _programmingService;
        private readonly IAddressAppService _addressAppService;

        public HostAppService(IHostService hostService, IProgrammingService programmingService, IAddressAppService addressAppService, IValidation<HostRegisterDTO> hostCreateValidation, IValidation<HostEditDTO> hostEditValidation)
        {
            _hostCreateValidation = hostCreateValidation;
            _hostEditValidation = hostEditValidation;
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

        public async Task<HostCreatedDTO?> Create(HostRegisterDTO dto, string userId)
        {
            _hostCreateValidation.Validate(dto, DateTime.UtcNow);

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
            {
                throw new InvalidOperationException("Failed to create host.");
            }

            return new HostCreatedDTO
            {
                Id = result.Id,
                AddressId = result.AddressId,
                Name = result.Name
            };

        }

        public async Task<HostResponseDTO?> EditHostAsync(HostEditDTO dto, int hostId, string userId)
        {
            _hostEditValidation.Validate(dto, DateTime.UtcNow);
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

            var result = await _hostService.EditHostAsync(host, userId);

            if (result == null)
            {
                return null;
            }

            return new HostResponseDTO
            {
                Id = result.Id,
                Typeofhost = result.Typeofhost,
                CNPJ = result.CNPJ,
                LogoUrl = result.LogoUrl,
                InstagranUrl = result.InstagranUrl,
                Phone = result.Phone,
                Name = result.Name,
                Description = result.Description,
                AddressId = result.AddressId,
                Address = new AddressDetailsDTO
                {
                    Id = result.Address.Id,
                    Street = result.Address.Street,
                    Number = result.Address.Number,
                    Complement = result.Address.Complement,
                    Neighborhood = result.Address.Neighborhood,
                    CEP = result.Address.CEP
                },
                IsActive = result.IsActive,
                CreatedAt = result.CreatedAt,
                UpdatedAt = result.UpdatedAt
            };
        }

        public async Task<HostResponseDTO?> DeleteHostAsync(int hostId, string userId)
        {
            var result = await _hostService.DeleteHostAsync(hostId, userId);

            if (result == null)
            {
                return null;
            }

            return new HostResponseDTO
            {
                Id = result.Id,
                Typeofhost = result.Typeofhost,
                CNPJ = result.CNPJ,
                LogoUrl = result.LogoUrl,
                InstagranUrl = result.InstagranUrl,
                Phone = result.Phone,
                Name = result.Name,
                Description = result.Description,
                AddressId = result.AddressId,
                Address = new AddressDetailsDTO
                {
                    Id = result.Address.Id,
                    Street = result.Address.Street,
                    Number = result.Address.Number,
                    Complement = result.Address.Complement,
                    Neighborhood = result.Address.Neighborhood,
                    CEP = result.Address.CEP
                },
                IsActive = result.IsActive,
                CreatedAt = result.CreatedAt,
                UpdatedAt = result.UpdatedAt
            };
        }

        public async Task<IEnumerable<HostResponseDTO>> GetAllHostsbyUserId(string userid)
        {
            var hosts = await _hostService.GetAllHostsbyUserId(userid);

            return hosts.Select(host => new HostResponseDTO
            {
                Id = host.Id,
                Typeofhost = host.Typeofhost,
                CNPJ = host.CNPJ,
                LogoUrl = host.LogoUrl,
                InstagranUrl = host.InstagranUrl,
                Phone = host.Phone,
                Name = host.Name,
                Description = host.Description,
                AddressId = host.AddressId,
                Address = new AddressDetailsDTO
                {
                    Id = host.Address.Id,
                    Street = host.Address.Street,
                    Number = host.Address.Number,
                    Complement = host.Address.Complement,
                    Neighborhood = host.Address.Neighborhood,
                    CEP = host.Address.CEP
                },
                IsActive = host.IsActive,
                CreatedAt = host.CreatedAt,
                UpdatedAt = host.UpdatedAt
            }).ToList();
        }
    }
}
