using Microsoft.EntityFrameworkCore;
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

        public async Task<List<UserXCategory>> EditAsync(string userId, List<UserXCategory> linksToAdd,List<UserXCategory> linksToRemove)
        {
            var categoryIdsToRemove = linksToRemove.Select(link => link.CategoryId).ToList();
            var existingLinksToRemove = await Db.Set<UserXCategory>()
                .Where(link => link.UserId == userId && categoryIdsToRemove.Contains(link.CategoryId))
                .ToListAsync();

            Db.Set<UserXCategory>().RemoveRange(existingLinksToRemove);

            foreach (var link in linksToAdd)
            {
                await Db.Set<UserXCategory>().AddAsync(link);
            }

            if (linksToAdd.Count > 0 || existingLinksToRemove.Count > 0)
            {
                await Db.SaveChangesAsync();
            }

            return await Db.Set<UserXCategory>()
                .Where(link => link.UserId == userId)
                .OrderBy(link => link.CategoryId)
                .ThenBy(link => link.Id)
                .ToListAsync();
        }
    }
}
