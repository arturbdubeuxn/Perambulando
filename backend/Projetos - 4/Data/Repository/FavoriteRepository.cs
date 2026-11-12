using Microsoft.EntityFrameworkCore;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model.Favorite;

namespace Projetos___4.Data.Repository
{
    public class FavoriteRepository : IFavoriteRepository
    {
        private readonly Context.Context Db;

        public FavoriteRepository(Context.Context context)
        {
            Db = context;
        }

        public async Task<Favorite> AddAsync(Favorite favorite)
        {
            var requestedIsActive = favorite.IsActive;
            await using var transaction = await Db.Database.BeginTransactionAsync();
            await Db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT 1 FROM \"Users\" WHERE \"Id\" = {favorite.UserId} FOR UPDATE");

            var existing = await GetFavoritebyUserAndProgrammingId(favorite.UserId, favorite.ProgrammingId);
            if (existing == null)
            {
                Db.Favorites.Add(favorite);
            }
            else
            {
                await Db.Entry(existing).ReloadAsync();
                if (existing.IsActive != requestedIsActive)
                {
                    existing.IsActive = requestedIsActive;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                favorite = existing;
            }

            await Db.SaveChangesAsync();
            await transaction.CommitAsync();
            return favorite;
        }

        public async Task<List<Favorite>> GetAllByUserIdAsync(string userId)
        {
            return await Db.Favorites.AsNoTracking()
                .Include(f => f.Programming)
                .Where(f => f.UserId == userId && f.IsActive &&
                    f.Programming.IsActive && f.Programming.Host.IsActive)
                .OrderByDescending(f => f.Programming.StartDate)
                .ToListAsync();
        }

        public Task<List<Favorite>> GetAllForDeactivationAsync(string userId)
        {
            return Db.Favorites.Where(favorite => favorite.UserId == userId && favorite.IsActive).ToListAsync();
        }

        public async Task<Favorite?> DeleteAsync(Favorite favorite)
        {
            if (favorite == null)
            {
                return null;
            }

            await using var transaction = await Db.Database.BeginTransactionAsync();
            await Db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT 1 FROM \"Users\" WHERE \"Id\" = {favorite.UserId} FOR UPDATE");

            var existing = await GetFavoritebyUserAndProgrammingId(favorite.UserId, favorite.ProgrammingId);
            if (existing == null)
            {
                return null;
            }

            await Db.Entry(existing).ReloadAsync();
            if (existing.IsActive)
            {
                existing.IsActive = false;
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await Db.SaveChangesAsync();
            await transaction.CommitAsync();
            return existing;
        }

        public async Task<Favorite?> GetFavoritebyUserAndProgrammingId(string userId, int programmingid)
        {
            return await Db.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.ProgrammingId == programmingid);
        }
    }
}
