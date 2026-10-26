using Microsoft.EntityFrameworkCore;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Repository
{
    public class FavoriteRepository : IFavoriteRepository
    {
        private readonly Context.Context Db;

        public FavoriteRepository(Context.Context context)
        {
            Db = context;
        }

        public async Task<Favorite> AddAsync(string userId, int programmingId)
        {
            await using var transaction = await Db.Database.BeginTransactionAsync();
            // Serializa as alterações do mesmo par usuário/programação, inclusive a reativação.
            await Db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT pg_advisory_xact_lock(hashtext({userId}), {programmingId})");

            var favorite = await Db.Favorites.Include(f => f.Programming).ThenInclude(p => p.Host)
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ProgrammingId == programmingId);

            if (favorite == null)
            {
                favorite = new Favorite { UserId = userId, ProgrammingId = programmingId };
                await Db.Favorites.AddAsync(favorite);
            }
            else if (!favorite.IsActive)
            {
                favorite.IsActive = true;
                favorite.UpdatedAt = DateTime.UtcNow;
            }

            await Db.SaveChangesAsync();
            await transaction.CommitAsync();
            // Carrega os dados usados pelo DTO também no primeiro cadastro.
            await Db.Entry(favorite).Reference(f => f.Programming).LoadAsync();
            await Db.Entry(favorite.Programming).Reference(p => p.Host).LoadAsync();
            return favorite;
        }

        public async Task<List<Favorite>> GetAllByUserIdAsync(string userId)
        {
            return await Db.Favorites.AsNoTracking()
                .Include(f => f.Programming).ThenInclude(p => p.Host)
                .Where(f => f.UserId == userId && f.IsActive &&
                    f.Programming.IsActive && f.Programming.Host.IsActive)
                .OrderByDescending(f => f.UpdatedAt).ThenByDescending(f => f.Id)
                .ToListAsync();
        }

        public async Task<Favorite?> DeleteAsync(string userId, int programmingId)
        {
            await using var transaction = await Db.Database.BeginTransactionAsync();
            await Db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT pg_advisory_xact_lock(hashtext({userId}), {programmingId})");

            var favorite = await Db.Favorites.Include(f => f.Programming).ThenInclude(p => p.Host)
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ProgrammingId == programmingId);

            if (favorite != null && favorite.IsActive)
            {
                favorite.IsActive = false;
                favorite.UpdatedAt = DateTime.UtcNow;
                await Db.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return favorite;
        }
    }
}
