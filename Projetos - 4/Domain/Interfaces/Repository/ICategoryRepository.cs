using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<Category>> GetallCategories();
        Task<List<Category>> GetAllCategoriesbyProgrammingId(int programmingId);
        public Task<Category> GetbyId(int categoryId);
    }
}
