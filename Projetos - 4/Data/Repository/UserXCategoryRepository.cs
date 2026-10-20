using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Repository
{
    public class UserXCategoryRepository : IUserXCategoryRepository
    {
        private readonly Context.Context Db;

        public UserXCategoryRepository(Context.Context context)
        {
            Db = context;
        }

        public async Task<UserXCategory?> AddAsync(UserXCategory userXCategory)
        {
            if (userXCategory == null)
            {
                throw new ArgumentNullException(nameof(userXCategory));
            }
            await Db.Set<UserXCategory>().AddAsync(userXCategory);
            await Db.SaveChangesAsync();
            return userXCategory;
        }
    }
}
