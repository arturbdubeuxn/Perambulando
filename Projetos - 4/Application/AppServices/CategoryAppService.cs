using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.Interfaces;

using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Application.DTO;

namespace Projetos___4.Application.AppServices
{
    public class CategoryAppService : ICategoryAppService
    {
        private readonly ICategoryService _categoryService;

        private readonly ICategoryMapping _categoryMapping;

        public CategoryAppService(ICategoryService categoryService, ICategoryMapping categoryMapping)
        {
            _categoryMapping = categoryMapping;
            _categoryService = categoryService;
        }

        public async Task<IEnumerable<CategoryResponseDTO>> GetallCategories()
        {
            var categories = await _categoryService.GetallCategories();
            return categories.Select(_categoryMapping.ToDTO).ToList();
        }

        public async Task<CategoryResponseDTO> GetbyId(int categoryId)
        {
            var category = await _categoryService.GetbyId(categoryId);
            return _categoryMapping.ToDTO(category);
        }

        public async Task<IEnumerable<CategoryResponseDTO>> GetAllCategoriesPrefereces(string userId)
        {
            var categories = await _categoryService.GetAllCategoriesPrefereces(userId);
            return categories.Select(_categoryMapping.ToDTO).ToList();
        }
    }
}
