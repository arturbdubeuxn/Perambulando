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
    }
}
