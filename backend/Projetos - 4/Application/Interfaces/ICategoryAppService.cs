using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Interfaces
{
    public interface ICategoryAppService
    {
        Task<IEnumerable<CategoryResponseDTO>> GetallCategories();

        Task<IEnumerable<CategoryResponseDTO>> GetAllCategoriesPrefereces(string userId);

        Task<CategoryResponseDTO> GetbyId(int categoryId);
    }
}
