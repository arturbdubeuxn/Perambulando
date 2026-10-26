using Microsoft.EntityFrameworkCore;
using Npgsql;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Repository
{
    public class ProgrammingXCategoryRepository : IProgrammingXCategoryRepository
    {
        private readonly Context.Context Db;
        public ProgrammingXCategoryRepository(Context.Context db)
        {
            Db = db;
        }

        public async Task<ProgrammingXCategory> CreateProgrammingXCategoryAsync(ProgrammingXCategory programmingXCategory)
        {
            ArgumentNullException.ThrowIfNull(programmingXCategory);
            await using var transaction = await Db.Database.BeginTransactionAsync();
            await Db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT pg_advisory_xact_lock(721906, {programmingXCategory.ProgrammingId})");
            try
            {
                var existing = await Db.ProgrammingXCategories
                    .OrderBy(link => link.Id).FirstOrDefaultAsync(link =>
                        link.ProgrammingId == programmingXCategory.ProgrammingId &&
                        link.CategoryId == programmingXCategory.CategoryId);
                if (existing != null)
                {
                    await transaction.CommitAsync();
                    return existing;
                }

                Db.ProgrammingXCategories.Add(programmingXCategory);
                await Db.SaveChangesAsync();
                await transaction.CommitAsync();
                return programmingXCategory;
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException postgres &&
                postgres.SqlState == PostgresErrorCodes.UniqueViolation &&
                postgres.ConstraintName == "IX_ProgrammingXCategories_ProgrammingId_CategoryId")
            {
                throw new CategoryLinksConflictException();
            }
        }
    }
}
