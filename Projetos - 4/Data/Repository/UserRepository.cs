using Microsoft.EntityFrameworkCore;
using Projetos___4._3___Domain.Interfaces;
using Projetos___4._3___Domain.Model;
using Projetos___4._4___Data.Context;

namespace Projetos___4._4___Data.Repository
{
    public class UserRepository : IUserRepository
    {
        private readonly Projetos___4._4___Data.Context.Context Db;

        public UserRepository(Projetos___4._4___Data.Context.Context context)
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
