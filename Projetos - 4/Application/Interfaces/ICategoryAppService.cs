using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Interfaces
{
    public interface ICategoryAppService
    {
        Task<IEnumerable<Category>> GetallCategories();

        Task<IEnumerable<Category>> GetAllCategoriesPrefereces(string userId);

        Task<Category> GetbyId(int categoryId);
    }
}
