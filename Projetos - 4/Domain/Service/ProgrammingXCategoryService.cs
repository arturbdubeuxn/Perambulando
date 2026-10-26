using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service
{
    public class ProgrammingXCategoryService : IProgrammingXCategoryService
    {
        private readonly IProgrammingXCategoryRepository _programmingXCategoryRepository;

        public ProgrammingXCategoryService(IProgrammingXCategoryRepository programmingXCategoryRepository)
        {
            _programmingXCategoryRepository = programmingXCategoryRepository;
        }

        public Task<List<ProgrammingXCategory>> GetAllByProgrammingIdAsync(int programmingId)
        {
            return _programmingXCategoryRepository.GetAllByProgrammingIdAsync(programmingId);
        }

        public List<ProgrammingXCategory> GetLinksToAdd(List<Category> currentCategories, List<ProgrammingXCategory> links)
        {
            var currentCategoryIds = currentCategories.Select(category => category.Id).ToHashSet();
            return links.Where(link => !currentCategoryIds.Contains(link.CategoryId)).ToList();
        }

        
    }
}
