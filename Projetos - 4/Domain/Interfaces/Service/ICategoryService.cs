using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface ICategoryService
    {
        Task<IEnumerable<Category>> GetallCategories();

        Task<IEnumerable<Category>> GetAllCategoriesPrefereces(string userId);

        Task<Category> GetbyId(int categoryId);

        List<int> GetCategoryIdsToRemove(List<Category> currentCategories, List<ProgrammingXCategory> links);
    }
}
