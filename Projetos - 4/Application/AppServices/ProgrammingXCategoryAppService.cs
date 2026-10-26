using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.AppServices
{
    public class ProgrammingXCategoryAppService : IProgrammingXCategoryAppService
    {
        private readonly IProgrammingXCategoryService _programmingXCategoryService;

        private readonly IProgrammingXCategoryMapping _programmingXCategoryMapping;

        public ProgrammingXCategoryAppService(IProgrammingXCategoryService programmingXCategoryService, IProgrammingXCategoryMapping programmingXCategoryMapping)
        {
            _programmingXCategoryMapping = programmingXCategoryMapping;
            _programmingXCategoryService = programmingXCategoryService;
        }
        public List<ProgrammingXCategory> CreateProgrammingLinks(Programming programming, List<int> categoriesIds)
        {
            var links = new List<ProgrammingXCategory>();
            foreach (var categoryId in categoriesIds)
            {
                links.Add(_programmingXCategoryMapping.ToModel(categoryId, programming));
            }

            return links;
        }

        public async Task<ProgrammingXCategoryResponseDTO> CreateProgrammingXCategoryAsync(int categoryId, int programmingId)
        {
            var programmingXCategory = _programmingXCategoryMapping.ToModel(categoryId, programmingId);
            var result = await _programmingXCategoryService.CreateProgrammingXCategoryAsync(programmingXCategory);
            return _programmingXCategoryMapping.ToDTO(result);
        }
    }
}
