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
            if (userCategories.Count == 0)
            {
                return new List<UserXCategory>();
            }

            var userId = userCategories.First().UserId;
            if (string.IsNullOrWhiteSpace(userId) || userCategories.Any(link => link.UserId != userId))
            {
                throw new ArgumentException("As categorias devem pertencer ao usuário informado.");
            }

            await using var transaction = await Db.Database.BeginTransactionAsync();
            await Db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT 1 FROM \"Users\" WHERE \"Id\" = {userId} FOR UPDATE");
            var currentLinks = await Db.UserXCategories.Where(link => link.UserId == userId).ToListAsync();
            if (currentLinks.Select(link => link.CategoryId).Union(userCategories.Select(link => link.CategoryId)).Count() > 3)
            {
                throw new ArgumentException("O usuário pode ter no máximo 3 categorias de preferência.");
            }

            var linksAdd = new List<UserXCategory>();
            foreach (var link in userCategories.DistinctBy(link => link.CategoryId))
            {
                var existing = currentLinks.FirstOrDefault(current => current.CategoryId == link.CategoryId);
                if (existing != null)
                {
                    linksAdd.Add(existing);
                }
                else
                {
                    Db.UserXCategories.Add(link);
                    linksAdd.Add(link);
                }
            }
            await Db.SaveChangesAsync();
            await transaction.CommitAsync();

            return linksAdd;
        }

        public async Task<List<UserXCategory>> EditAsync(string userId, List<UserXCategory> linksToAdd,List<UserXCategory> linksToRemove,
            IReadOnlyCollection<int> expectedCategoryIds)
        {
                if (linksToAdd.Any(link => link.UserId != userId))
                {
                    throw new ArgumentException("As categorias devem pertencer ao usuário informado.");
                }

                await using var transaction = await Db.Database.BeginTransactionAsync();
                await Db.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT 1 FROM \"Users\" WHERE \"Id\" = {userId} FOR UPDATE");
                var currentLinks = await Db.UserXCategories.Where(link => link.UserId == userId).ToListAsync();
                var currentIds = currentLinks.Select(link => link.CategoryId).ToHashSet();
                if (!currentIds.SetEquals(expectedCategoryIds))
                {
                    throw new CategoryLinksConflictException();
                }

                var categoryIdsToRemove = linksToRemove.Select(link => link.CategoryId).ToHashSet();
                var finalCategoryIds = currentIds.Except(categoryIdsToRemove)
                    .Union(linksToAdd.Select(link => link.CategoryId));
                if (finalCategoryIds.Count() > 3)
                {
                    throw new ArgumentException("O usuário pode ter no máximo 3 categorias de preferência.");
                }
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
                await transaction.CommitAsync();
                return currentLinks;
            }
    }
}
