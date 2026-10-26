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
            ArgumentNullException.ThrowIfNull(userCategories);
            if (userCategories.Count == 0)
            {
                return new List<UserXCategory>();
            }

            var requestedLinks = userCategories.GroupBy(link => link.CategoryId).Select(group => group.First()).ToList();
            var userId = requestedLinks[0].UserId;
            if (userCategories.Any(link => link.UserId != userId))
            {
                throw new ArgumentException("As categorias devem pertencer ao mesmo usuário.");
            }

            await using var transaction = await Db.Database.BeginTransactionAsync();
            await Db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT pg_advisory_xact_lock(721905, hashtext({userId}))");
            try
            {
                var categoryIds = requestedLinks.Select(link => link.CategoryId).ToList();
                var existingLinks = await Db.UserXCategories
                    .Where(link => link.UserId == userId && categoryIds.Contains(link.CategoryId))
                    .OrderBy(link => link.Id).ToListAsync();
                var linksByCategory = existingLinks.GroupBy(link => link.CategoryId)
                    .ToDictionary(group => group.Key, group => group.First());
                var result = new List<UserXCategory>();
                var added = false;

                foreach (var link in requestedLinks)
                {
                    if (!linksByCategory.TryGetValue(link.CategoryId, out var savedLink))
                    {
                        await Db.UserXCategories.AddAsync(link);
                        savedLink = link;
                        linksByCategory.Add(link.CategoryId, link);
                        added = true;
                    }
                    result.Add(savedLink);
                }

                if (added)
                {
                    await Db.SaveChangesAsync();
                }
                await transaction.CommitAsync();
                return result;
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException postgres &&
                postgres.SqlState == PostgresErrorCodes.UniqueViolation &&
                postgres.ConstraintName == "IX_UserXCategories_UserId_CategoryId")
            {
                throw new CategoryLinksConflictException();
            }
        }

        public async Task<List<UserXCategory>> EditAsync(string userId, List<UserXCategory> linksToAdd,
            List<UserXCategory> linksToRemove, IReadOnlyCollection<int> expectedCategoryIds)
        {
            ArgumentNullException.ThrowIfNull(expectedCategoryIds);
            await using var transaction = await Db.Database.BeginTransactionAsync();
            await Db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT pg_advisory_xact_lock(721905, hashtext({userId}))");
            try
            {
                var currentLinks = await Db.UserXCategories.Where(link => link.UserId == userId).ToListAsync();
                var currentIds = currentLinks.Select(link => link.CategoryId).ToHashSet();
                if (!currentIds.SetEquals(expectedCategoryIds))
                {
                    throw new CategoryLinksConflictException();
                }

                var categoryIdsToRemove = linksToRemove.Select(link => link.CategoryId).ToHashSet();
                var existingLinksToRemove = currentLinks.Where(link => categoryIdsToRemove.Contains(link.CategoryId)).ToList();
                Db.UserXCategories.RemoveRange(existingLinksToRemove);
                currentIds.ExceptWith(categoryIdsToRemove);
                var added = false;

                foreach (var link in linksToAdd)
                {
                    if (currentIds.Add(link.CategoryId))
                    {
                        await Db.UserXCategories.AddAsync(link);
                        added = true;
                    }
                }

                if (added || existingLinksToRemove.Count > 0)
                {
                    await Db.SaveChangesAsync();
                }

                var result = await Db.UserXCategories.Where(link => link.UserId == userId)
                    .OrderBy(link => link.CategoryId).ThenBy(link => link.Id).ToListAsync();
                await transaction.CommitAsync();
                return result;
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException postgres &&
                postgres.SqlState == PostgresErrorCodes.UniqueViolation &&
                postgres.ConstraintName == "IX_UserXCategories_UserId_CategoryId")
            {
                throw new CategoryLinksConflictException();
            }
        }
    }
}
