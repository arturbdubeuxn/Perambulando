using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.AppServices
{
    public class ProgrammingAppService : IProgrammingAppService
    {
        private readonly IProgrammingService _programmingService;
        private readonly IAddressService _addressService;

        public ProgrammingAppService(IProgrammingService programmingService, IAddressService addressService)
        {
            _programmingService = programmingService;
            _addressService = addressService;
        }

        public async Task<ProgrammingDetailsDTO?> GetByIdAsync(int programmingId)
        {
            var programming = await _programmingService.GetByIdAsync(programmingId);
            if (programming == null)
            {
                return null;
            }

            var address = programming.Address;

            return new ProgrammingDetailsDTO
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
                    Id = address.Id,
                    Street = address.Street,
                    Number = address.Number,
                    Complement = address.Complement,
                    Neighborhood = address.Neighborhood,
                    CEP = address.CEP
                },
                ImageUrl = programming.ImageUrl,
                TicketUrl = programming.TicketUrl,
                InstagranUrl = programming.InstagranUrl,
                HostName = programming.Host.Name,
                HostLogoUrl = programming.Host.LogoUrl,
                CreatedDate = programming.CreatedDate,
                UpdateDate = programming.UpdateDate,
                MinPrice = programming.MinPrice,
                MaxPrice = programming.MaxPrice,
                Categories = await _programmingService.GetAllCategoriesbyProgrammingId(programmingId)
            };
        }

        public Task<Programming?> DeleteProgrammingAsync(int id, int hostId, string userId)
        {
            return _programmingService.DeleteProgrammingAsync(id, hostId, userId);
        }

        public Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId, string userId)
        {
            return _programmingService.GetAllProgrammingsbyHostId(hostId, userId);
        }

        public Task<Programming?> EditProgrammingAsync(ProgrammingEditDTO dto, int id, int hostId, string userId)
        {
            var programming = new Programming
            {
                Id = id,
                HostId = hostId,
                Name = dto.Name,
                Description = dto.Description,
                StartDate = dto.StartDate!.Value,
                EndDate = dto.EndDate!.Value,
                IsFree = dto.IsFree!.Value,
                AddressId = dto.AddressId ?? 0,
                ImageUrl = dto.ImageUrl,
                TicketUrl = dto.TicketUrl,
                InstagranUrl = dto.InstagranUrl,
                MinPrice = dto.MinPrice!.Value,
                MaxPrice = dto.MaxPrice!.Value
            };

            if (dto.Address != null)
            {
                programming.Address = new Address
                {
                    Street = dto.Address.Street,
                    Number = dto.Address.Number,
                    Complement = dto.Address.Complement ?? string.Empty,
                    Neighborhood = dto.Address.Neighborhood ?? string.Empty,
                    CEP = dto.Address.CEP
                };
            }

            var links = new List<ProgrammingXCategory>();
            foreach (var categoryId in dto.categoryIds)
            {
                links.Add(new ProgrammingXCategory
                {
                    Programming = programming,
                    CategoryId = categoryId
                });
            }

            return _programmingService.EditProgrammingAsync(programming, links, userId);
        }

        public async Task<Programming> CreateProgrammingAsync(ProgrammingCreateDTO dto, int hostId,string userId)
        {
            var programming = new Programming
            {
                Name = dto.Name,
                Description = dto.Description,
                HostId = hostId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsFree = dto.IsFree,
                AddressId = dto.AddressId ?? 0,
                ImageUrl = dto.ImageUrl,
                TicketUrl = dto.TicketUrl,
                InstagranUrl = dto.InstagranUrl,
                MinPrice = dto.MinPrice,
                MaxPrice = dto.MaxPrice
            };

            if (dto.Address != null)
            {
                programming.Address = new Address
                {
                    Street = dto.Address.Street,
                    Number = dto.Address.Number,
                    Complement = dto.Address.Complement ?? string.Empty,
                    Neighborhood = dto.Address.Neighborhood ?? string.Empty,
                    CEP = dto.Address.CEP
                };
            }

            var links = new List<ProgrammingXCategory>();
            foreach (var categoryId in dto.categoryIds)
            {
                links.Add(new ProgrammingXCategory
                {
                    Programming = programming,
                    CategoryId = categoryId
                });
            }

            return await _programmingService.CreateProgrammingAsync(programming, links, userId);
        }

        public Task<List<Programming>> GetAllProgrammingsByUserCategoriesAsync(string userId)
        {
            return _programmingService.GetAllProgrammingsByUserCategories(userId);
        }
    }
}
