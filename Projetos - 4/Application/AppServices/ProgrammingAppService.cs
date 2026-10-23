using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Validations.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using System.Collections.Generic;

namespace Projetos___4.Application.AppServices
{
    public class ProgrammingAppService : IProgrammingAppService
    {
        private readonly IProgrammingService _programmingService;
        private readonly IAddressService _addressService;
        private readonly IValidation<ProgrammingCreateDTO> _programmingCreateValidation;
        private readonly IValidation<ProgrammingEditDTO> _programmingEditValidation;
        public ProgrammingAppService(IProgrammingService programmingService, IAddressService addressService, IValidation<ProgrammingEditDTO> programmingValidation, IValidation<ProgrammingCreateDTO> validation)
        {
            _programmingService = programmingService;
            _addressService = addressService;
            _programmingEditValidation = programmingValidation;
            _programmingCreateValidation = validation;
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
                Categories = (await _programmingService.GetAllCategoriesbyProgrammingId(programmingId))
                    .Select(category => new CategoryResponseDTO
                    {
                        Id = category.Id,
                        Name = category.Name,
                        IsActive = category.IsActive
                    }).ToList()
            };
        }

        public async Task<ProgrammingResponseDTO?> DeleteProgrammingAsync(int id, int hostId, string userId)
        {
            var result = await _programmingService.DeleteProgrammingAsync(id, hostId, userId);
            if (result == null)
            {
                return null;
            }

            return new ProgrammingResponseDTO
            {
                Id = result.Id,
                Name = result.Name,
                IsActive = result.IsActive,
                Description = result.Description,
                StartDate = result.StartDate,
                EndDate = result.EndDate,
                IsFree = result.IsFree,
                ImageUrl = result.ImageUrl,
                TicketUrl = result.TicketUrl,
                InstagranUrl = result.InstagranUrl,
                HostId = result.HostId,
                AddressId = result.AddressId,
                CreatedDate = result.CreatedDate,
                UpdateDate = result.UpdateDate,
                MinPrice = result.MinPrice,
                MaxPrice = result.MaxPrice,
                Address = new AddressDetailsDTO
                {
                    Id = result.Address.Id,
                    Street = result.Address.Street,
                    Number = result.Address.Number,
                    Complement = result.Address.Complement,
                    Neighborhood = result.Address.Neighborhood,
                    CEP = result.Address.CEP
                }
            };
        }

        public async Task<IEnumerable<ProgrammingResponseDTO>> GetAllProgrammingsbyHostId(int hostId, string userId)
        {
            var programmings = await _programmingService.GetAllProgrammingsbyHostId(hostId, userId);

            return programmings.Select(programming => new ProgrammingResponseDTO
            {
                Id = programming.Id,
                Name = programming.Name,
                IsActive = programming.IsActive,
                Description = programming.Description,
                StartDate = programming.StartDate,
                EndDate = programming.EndDate,
                IsFree = programming.IsFree,
                ImageUrl = programming.ImageUrl,
                TicketUrl = programming.TicketUrl,
                InstagranUrl = programming.InstagranUrl,
                HostId = programming.HostId,
                AddressId = programming.AddressId,
                CreatedDate = programming.CreatedDate,
                UpdateDate = programming.UpdateDate,
                MinPrice = programming.MinPrice,
                MaxPrice = programming.MaxPrice,
                Address = new AddressDetailsDTO
                {
                    Id = programming.Address.Id,
                    Street = programming.Address.Street,
                    Number = programming.Address.Number,
                    Complement = programming.Address.Complement,
                    Neighborhood = programming.Address.Neighborhood,
                    CEP = programming.Address.CEP
                }
            }).ToList();
        }

        public async Task<ProgrammingResponseDTO?> EditProgrammingAsync(ProgrammingEditDTO dto, int id, int hostId, string userId)
        {
            _programmingEditValidation.Validate(dto, DateTime.UtcNow);

            var programming = new Programming
            {
                Id = id,
                HostId = hostId,
                Name = dto.Name,
                Description = dto.Description,
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
            foreach (var categoryId in dto.categoryIds!)
            {
                links.Add(new ProgrammingXCategory
                {
                    Programming = programming,
                    CategoryId = categoryId
                });
            }

            var result = await _programmingService.EditProgrammingAsync(programming, links, userId);
            if (result == null)
            {
                return null;
            }

            return new ProgrammingResponseDTO
            {
                Id = result.Id,
                Name = result.Name,
                IsActive = result.IsActive,
                Description = result.Description,
                StartDate = result.StartDate,
                EndDate = result.EndDate,
                IsFree = result.IsFree,
                ImageUrl = result.ImageUrl,
                TicketUrl = result.TicketUrl,
                InstagranUrl = result.InstagranUrl,
                HostId = result.HostId,
                AddressId = result.AddressId,
                CreatedDate = result.CreatedDate,
                UpdateDate = result.UpdateDate,
                MinPrice = result.MinPrice,
                MaxPrice = result.MaxPrice,
                Address = new AddressDetailsDTO
                {
                    Id = result.Address.Id,
                    Street = result.Address.Street,
                    Number = result.Address.Number,
                    Complement = result.Address.Complement,
                    Neighborhood = result.Address.Neighborhood,
                    CEP = result.Address.CEP
                }
            };
        }

        public async Task<ProgrammingResponseDTO> CreateProgrammingAsync(ProgrammingCreateDTO dto, int hostId,string userId)
        {
            _programmingCreateValidation.Validate(dto, DateTime.UtcNow);

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
            foreach (var categoryId in dto.categoryIds!)
            {
                links.Add(new ProgrammingXCategory
                {
                    Programming = programming,
                    CategoryId = categoryId
                });
            }

            var result = await _programmingService.CreateProgrammingAsync(programming, links, userId);

            return new ProgrammingResponseDTO
            {
                Id = result.Id,
                Name = result.Name,
                IsActive = result.IsActive,
                Description = result.Description,
                StartDate = result.StartDate,
                EndDate = result.EndDate,
                IsFree = result.IsFree,
                ImageUrl = result.ImageUrl,
                TicketUrl = result.TicketUrl,
                InstagranUrl = result.InstagranUrl,
                HostId = result.HostId,
                AddressId = result.AddressId,
                CreatedDate = result.CreatedDate,
                UpdateDate = result.UpdateDate,
                MinPrice = result.MinPrice,
                MaxPrice = result.MaxPrice,
                Address = new AddressDetailsDTO
                {
                    Id = result.Address.Id,
                    Street = result.Address.Street,
                    Number = result.Address.Number,
                    Complement = result.Address.Complement,
                    Neighborhood = result.Address.Neighborhood,
                    CEP = result.Address.CEP
                }
            };
        }

        public async Task<List<ProgrammingResponseDTO>> GetAllProgrammingsByUserCategoriesAsync(string userId)
        {
            var programmings = await _programmingService.GetAllProgrammingsByUserCategories(userId);

            return programmings.Select(programming => new ProgrammingResponseDTO
            {
                Id = programming.Id,
                Name = programming.Name,
                IsActive = programming.IsActive,
                Description = programming.Description,
                StartDate = programming.StartDate,
                EndDate = programming.EndDate,
                IsFree = programming.IsFree,
                ImageUrl = programming.ImageUrl,
                TicketUrl = programming.TicketUrl,
                InstagranUrl = programming.InstagranUrl,
                HostId = programming.HostId,
                AddressId = programming.AddressId,
                CreatedDate = programming.CreatedDate,
                UpdateDate = programming.UpdateDate,
                MinPrice = programming.MinPrice,
                MaxPrice = programming.MaxPrice,
                Address = new AddressDetailsDTO
                {
                    Id = programming.Address.Id,
                    Street = programming.Address.Street,
                    Number = programming.Address.Number,
                    Complement = programming.Address.Complement,
                    Neighborhood = programming.Address.Neighborhood,
                    CEP = programming.Address.CEP
                }
            }).ToList();
        }
    }
}
