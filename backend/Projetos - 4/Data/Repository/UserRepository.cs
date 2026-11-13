using Microsoft.EntityFrameworkCore;
using Projetos___4.Domain.Interfaces;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Repository
{
    public class UserRepository : IUserRepository
    {
        private readonly Context.Context Db;

        public UserRepository(Context.Context context)
        {
            Db = context;
        }

        public async Task<User?> GetbyId(string id)
        {
            if(string.IsNullOrEmpty(id))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(id));
            }

            return await Db.Set<User>().FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<bool> DeleteAsync(string userId, Func<Task<bool>> deactivate)
        {
            ArgumentNullException.ThrowIfNull(deactivate);
            await using var transaction = await Db.Database.BeginTransactionAsync();
            try
            {
                await Db.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT 1 FROM \"Users\" WHERE \"Id\" = {userId} FOR UPDATE");
                var user = await GetbyId(userId);
                if (user == null)
                {
                    return false;
                }

                await Db.Entry(user).ReloadAsync();
                if (!user.IsActive)
                {
                    return false;
                }

                if (!await deactivate())
                {
                    await transaction.RollbackAsync();
                    Db.ChangeTracker.Clear();
                    return false;
                }

                await Db.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                Db.ChangeTracker.Clear();
                throw;
            }
        }
    }
}
