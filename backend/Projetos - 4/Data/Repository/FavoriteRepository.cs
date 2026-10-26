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

        public async Task<Favorite> AddAsync(Favorite favorite)
        {
            Db.Favorites.Add(favorite);

            await Db.SaveChangesAsync();

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

        public async Task<Favorite?> DeleteAsync(Favorite favorite)
        {
           if(favorite != null)
            {
                await Db.SaveChangesAsync();
            }

            return favorite;
        }

        public async Task<Favorite?> GetFavoritebyUserAndProgrammingId(string userId, int programmingid)
        {
            return await Db.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.ProgrammingId == programmingid);
        }
    }
}
