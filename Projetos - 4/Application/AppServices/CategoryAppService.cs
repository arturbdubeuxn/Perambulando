using Projetos___4.Application.Interfaces;

using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.AppServices
{
    public class CategoryAppService : ICategoryAppService
    {
        private readonly ICategoryService _categoryService;

        public CategoryAppService(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        public Task<IEnumerable<Category>> GetallCategories()
        {
            return _categoryService.GetallCategories();
        }

        public Task<Category> GetbyId(int categoryId)
        {
            return _categoryService.GetbyId(categoryId);
        }

        public Task<IEnumerable<Category>> GetAllCategoriesPrefereces(string userId)
        {
            return _categoryService.GetAllCategoriesPrefereces(userId);
        }
    }
}
