using Microsoft.EntityFrameworkCore;
using Npgsql;
using Projetos___4.Domain.Exceptions;
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

        public async Task<List<UserXCategory>> AddAsync(IReadOnlyCollection<UserXCategory> userCategories)
        {
          List<UserXCategory> linksAdd = new List<UserXCategory>();
          foreach(var links in userCategories)
            {
                Db.UserXCategories.Add(links);
                linksAdd.Add(links);
            }
            await Db.SaveChangesAsync();

            return linksAdd;
        }

        public async Task<List<UserXCategory>> EditAsync(string userId, List<UserXCategory> linksToAdd,List<UserXCategory> linksToRemove)
        {
         var currentLinks = await Db.UserXCategories.Where(link => link.UserId == userId).ToListAsync();

                var categoryIdsToRemove = linksToRemove.Select(link => link.CategoryId).ToHashSet();
                var existingLinksToRemove = currentLinks
                    .Where(link => categoryIdsToRemove.Contains(link.CategoryId)).ToList();

                foreach (var link in existingLinksToRemove)
                {
                    Db.Remove(link);
                    currentLinks.Remove(link);
                }

                foreach (var link in linksToAdd)
                {
                    if (!currentLinks.Any(current => current.CategoryId == link.CategoryId))
                    {
                        Db.Add(link);
                        currentLinks.Add(link);
                    }
                }

                await Db.SaveChangesAsync();
                return currentLinks;
            }
    }
}
