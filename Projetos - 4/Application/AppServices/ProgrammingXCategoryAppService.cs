using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.AppServices
{
    public class ProgrammingXCategoryAppService : IProgrammingXCategoryAppService
    {
        private readonly IProgrammingXCategoryService _programmingXCategoryService;

        public ProgrammingXCategoryAppService(IProgrammingXCategoryService programmingXCategoryService)
        {
            _programmingXCategoryService = programmingXCategoryService;
        }
        public async Task<ProgrammingXCategoryResponseDTO> CreateProgrammingXCategoryAsync(int categoryId, int programmingId)
        {
            var programmingXCategory = new ProgrammingXCategory
            {
                ProgrammingId = programmingId,
                CategoryId = categoryId
            };

            var result = await _programmingXCategoryService.CreateProgrammingXCategoryAsync(programmingXCategory);

            return new ProgrammingXCategoryResponseDTO
            {
                Id = result.Id,
                ProgrammingId = result.ProgrammingId,
                CategoryId = result.CategoryId
            };
        }
    }
}
