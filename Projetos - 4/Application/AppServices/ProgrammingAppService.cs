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
        public ProgrammingAppService(IProgrammingService programmingService)
        {
            _programmingService = programmingService;
        }

        public async Task<ProgrammingDetailsDTO?> GetByIdAsync(int programmingId)
        {
            var programming = await _programmingService.GetByIdAsync(programmingId);
            if (programming == null)
                return null;

            return new ProgrammingDetailsDTO
            {
                Id = programming.Id,
                Name = programming.Name,
                IsActive = programming.IsActive,
                Description = programming.Description,
                StartDate = programming.StartDate,
                EndDate = programming.EndDate,
                IsFree = programming.IsFree,
                Address = programming.Address,
                Neighborhood = programming.Neighborhood,
                CEP = programming.CEP,
                ImageUrl = programming.ImageUrl,
                TicketUrl = programming.TicketUrl,
                InstagranUrl = programming.InstagranUrl,
                HostId = programming.HostId,
                HostName = programming.Host.Name,
                HostLogoUrl = programming.Host.LogoUrl,
                CreatedDate = programming.CreatedDate,
                UpdateDate = programming.UpdateDate,
                MinPrice = programming.MinPrice,
                MaxPrice = programming.MaxPrice
            };
        }

        public Task<OperationResult<Programming>> DeleteProgrammingAsync(int id, int hostId, string userId)
        {
            return _programmingService.DeleteProgrammingAsync(id, hostId, userId);
        }

        public Task<OperationResult<IEnumerable<Programming>>> GetAllProgrammingsbyHostId(int hostId, string userId)
        {
            return _programmingService.GetAllProgrammingsbyHostId(hostId, userId);
        }

        public Task<OperationResult<Programming>> EditProgrammingAsync(ProgrammingEditDTO dto, int id, int hostId, string userId)
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
                Address = dto.Address,
                Neighborhood = dto.Neighborhood,
                CEP = dto.CEP,
                ImageUrl = dto.ImageUrl,
                TicketUrl = dto.TicketUrl,
                InstagranUrl = dto.InstagranUrl,
                MinPrice = dto.MinPrice!.Value,
                MaxPrice = dto.MaxPrice!.Value
            };

            return _programmingService.EditProgrammingAsync(programming, userId);
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
                Address = dto.Address,
                Neighborhood = dto.Neighborhood,
                CEP = dto.CEP,
                ImageUrl = dto.ImageUrl,
                TicketUrl = dto.TicketUrl,
                InstagranUrl = dto.InstagranUrl,
                MinPrice = dto.MinPrice,
                MaxPrice = dto.MaxPrice
            };

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
    }
}
