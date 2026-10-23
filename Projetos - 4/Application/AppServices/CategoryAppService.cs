using Projetos___4.Application.Interfaces;

using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Application.DTO;

namespace Projetos___4.Application.AppServices
{
    public class CategoryAppService : ICategoryAppService
    {
        private readonly ICategoryService _categoryService;

        public CategoryAppService(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        public async Task<IEnumerable<CategoryResponseDTO>> GetallCategories()
        {
            var categories = await _categoryService.GetallCategories();

            return categories.Select(category => new CategoryResponseDTO
            {
                Id = category.Id,
                Name = category.Name,
                IsActive = category.IsActive
            }).ToList();
        }

        public async Task<CategoryResponseDTO> GetbyId(int categoryId)
        {
            var category = await _categoryService.GetbyId(categoryId);

            return new CategoryResponseDTO
            {
                Id = category.Id,
                Name = category.Name,
                IsActive = category.IsActive
            };
        }

        public async Task<IEnumerable<CategoryResponseDTO>> GetAllCategoriesPrefereces(string userId)
        {
            var categories = await _categoryService.GetAllCategoriesPrefereces(userId);

            return categories.Select(category => new CategoryResponseDTO
            {
                Id = category.Id,
                Name = category.Name,
                IsActive = category.IsActive
            }).ToList();
        }
    }
}
