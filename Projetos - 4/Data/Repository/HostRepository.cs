using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Projetos___4.Domain.Model;
using Projetos___4.Data.Context;
using Projetos___4.Domain.Interfaces.Repository;

namespace Projetos___4.Data.Repository
{
    public class HostRepository : IHostRepository
    {
        private readonly Context.Context Db;
        public HostRepository(Context.Context db)
        {
            Db = db;
        }

        public async Task<OperationResult<Hosts>>Create(Hosts hosts)
        {
            if(hosts == null)
            {
                throw new ArgumentNullException(nameof(hosts));
            }

            Db.Set<Hosts>().Add(hosts);
            var result = await Db.SaveChangesAsync() > 0;
            return new OperationResult<Hosts>(
                result,
                result ? hosts : null,
                result ? "Host created successfully." : "Failed to create host."
            );
        }

        public async Task<bool> UserOwnsActiveHostAsync(Programming programming, string userId)
        {
            var host = await Db.Hosts.AnyAsync(h => h.Id == programming.HostId && h.UserId == userId && h.IsActive == true);
            return host;
        }

        public async Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userId)
        {
            return await Db.Hosts.Where(h => h.UserId == userId && h.IsActive == true).ToListAsync();
        }
    }
}
