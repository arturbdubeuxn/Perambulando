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
        public Task<ProgrammingXCategory> CreateProgrammingXCategoryAsync(int categoryId, int programmingId)
        {
            var programmingXCategory = new ProgrammingXCategory
            {
                ProgrammingId = programmingId,
                CategoryId = categoryId
            };

            return _programmingXCategoryService.CreateProgrammingXCategoryAsync(programmingXCategory);
        }
    }
}
