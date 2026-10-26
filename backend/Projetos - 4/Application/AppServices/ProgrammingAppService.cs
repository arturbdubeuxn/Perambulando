using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Mapping.Interfaces;
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
        private readonly IValidation<ProgrammingDTO> _programmingValidation;
        private readonly IProgrammingMapping _programmingMapping;
        private readonly IProgrammingXCategoryAppService _programmingXCategoryAppService;

        public ProgrammingAppService(IProgrammingService programmingService, IAddressService addressService, IValidation<ProgrammingDTO> programmingValidation, IProgrammingMapping programmingMapping, IProgrammingXCategoryAppService programmingXCategoryAppService)
        {
            _programmingService = programmingService;
            _addressService = addressService;
            _programmingValidation = programmingValidation;
            _programmingMapping = programmingMapping;
            _programmingXCategoryAppService = programmingXCategoryAppService;
        }

        public async Task<List<ProgrammingResponseDTO>> GetAllProgrammingsAsync(int take, int skip)
        {
            var programmings = await _programmingService.GetAllProgrammingsAsync(take, skip);
            return programmings.Select(_programmingMapping.ToDTO).ToList();
        }

        public async Task<ProgrammingDetailsDTO?> GetByIdAsync(int programmingId)
        {
            var programming = await _programmingService.GetByIdAsync(programmingId);
            if (programming == null)
            {
                return null;
            }

            var categories = await _programmingService.GetAllCategoriesbyProgrammingId(programmingId);
            return _programmingMapping.ToDetailsDTO(programming, programming.Host, categories);
        }

        public async Task<ProgrammingResponseDTO?> DeleteProgrammingAsync(int id, int hostId, string userId)
        {
            var result = await _programmingService.DeleteProgrammingAsync(id, hostId, userId);
            if (result == null)
            {
                return null;
            }

            return _programmingMapping.ToDTO(result);
        }

        public async Task<IEnumerable<ProgrammingResponseDTO>> GetAllProgrammingsbyHostId(int hostId, string userId)
        {
            var programmings = await _programmingService.GetAllProgrammingsbyHostId(hostId, userId);

            return programmings.Select(_programmingMapping.ToDTO).ToList();
        }

        public async Task<ProgrammingResponseDTO?> EditProgrammingAsync(ProgrammingDTO dto, int id, int hostId, string userId)
        {
            _programmingValidation.Validate(dto, DateTime.UtcNow);

            var programming = _programmingMapping.ToModel(dto);
            programming.Id = id;
            programming.HostId = hostId;

            List<ProgrammingXCategory> links = _programmingXCategoryAppService.CreateProgrammingLinks(programming, dto.categoryIds);

            var result = await _programmingService.EditProgrammingAsync(programming, links, userId);
            if (result == null)
            {
                return null;
            }

            return _programmingMapping.ToDTO(result);
        }

        public async Task<ProgrammingResponseDTO> CreateProgrammingAsync(ProgrammingDTO dto, int hostId,string userId)
        {
            _programmingValidation.Validate(dto, DateTime.UtcNow);

            var programming = _programmingMapping.ToModel(dto);
            programming.HostId = hostId;

            List<ProgrammingXCategory> links = _programmingXCategoryAppService.CreateProgrammingLinks(programming, dto.categoryIds);

            var result = await _programmingService.CreateProgrammingAsync(programming, links, userId);

            return _programmingMapping.ToDTO(result);
        }

        public async Task<List<ProgrammingResponseDTO>> GetAllProgrammingsByUserCategoriesAsync(string userId)
        {
            var programmings = await _programmingService.GetAllProgrammingsByUserCategories(userId);

            return programmings.Select(_programmingMapping.ToDTO).ToList();
        }
    }
}
