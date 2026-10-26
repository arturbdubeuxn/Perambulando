using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service
{
    public class CategoryService :ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public Task<IEnumerable<Category>> GetallCategories()
        {
            return _categoryRepository.GetallCategories();
        }

        public Task<IEnumerable<Category>> GetAllCategoriesPrefereces(string userId)
        {
            return _categoryRepository.GetAllCategoriesbyUserId(userId);
        }

        public List<int> GetCategoryIdsToRemove(List<Category> currentCategories, List<ProgrammingXCategory> links)
        {
            var currentCategoryIds = currentCategories.Select(category => category.Id).ToHashSet();
            var desiredCategoryIds = links.Select(link => link.CategoryId).ToHashSet();
            return currentCategoryIds.Except(desiredCategoryIds).ToList();
        }

        public Task<Category> GetbyId(int categoryId)
        {
            return _categoryRepository.GetbyId(categoryId);
        }
    }
}
