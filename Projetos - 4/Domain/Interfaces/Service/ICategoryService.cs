namespace Projetos___4.Domain.Interfaces.Service
{
    public interface ICategoryService
    {
        Task<IEnumerable<Projetos___4.Domain.Model.Category>> GetallCategories();
        Task<Projetos___4.Domain.Model.Category> GetbyId(int categoryId);
    }
}
