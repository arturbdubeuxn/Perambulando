using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;
using Microsoft.EntityFrameworkCore;

namespace Projetos___4.Data.Repository
{

    public class CategoryRepository : ICategoryRepository
    {
        private readonly Context.Context Db;
        public CategoryRepository(Context.Context db)
        {
            Db = db;
        }
        public async Task<IEnumerable<Category>> GetallCategories()
        {
            return await Db.Categories
                .AsNoTracking()
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public Task<Category> GetbyId (int categoryId)
        {
          
            var category = Db.Categories.FirstOrDefault(c => c.Id == categoryId && c.IsActive == true);
            if (category == null)
            {
                throw new Exception("Category not found or inactive.");
            }
            return Task.FromResult(category);
        }
    }
}
