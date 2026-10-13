using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Projetos___4._3___Domain.Model;
using Projetos___4._4___Data.Context;
using Projetos___4.Domain.Interfaces.Repository;

namespace Projetos___4.Data.Repository
{
    public class HostRepository : IHostRepository
    {
        private readonly Context Db;
        public HostRepository(Context db)
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
    }
}
