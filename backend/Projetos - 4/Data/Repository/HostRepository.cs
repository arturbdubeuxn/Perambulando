using Projetos___4.Domain.Exceptions;
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

        public Task<bool> CnpjExistsAsync(string cnpj, int excludedHostId = 0)
        {
            return Db.Hosts.AnyAsync(host => host.Id != excludedHostId &&
                host.CNPJ.Trim().Replace(".", "").Replace("/", "").Replace("-", "").ToUpper() == cnpj);
        }

        private async Task CheckCnpjForSaveAsync(Hosts host)
        {
            // Mesmo lock em create/edit: serializa a verificação final entre instâncias da API.
            // Não substitui um índice único para gravações externas à aplicação.
            await Db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(721904, 1)");
            if (await CnpjExistsAsync(host.CNPJ, host.Id))
            {
                throw new CnpjException(CnpjFailure.Duplicate, "Já existe um host cadastrado com este CNPJ.");
            }
        }

        public async Task<Hosts?> Create(Hosts hosts, Func<Task> assignRole)
        {
            ArgumentNullException.ThrowIfNull(hosts);
            ArgumentNullException.ThrowIfNull(assignRole);

            await using var transaction = await Db.Database.BeginTransactionAsync();
            try
            {
                await CheckCnpjForSaveAsync(hosts);
                if (hosts.Address.Id == 0)
                {
                    Db.Addresses.Add(hosts.Address);
                }

                Db.Set<Hosts>().Add(hosts);
                await Db.SaveChangesAsync();

                await assignRole();

                await transaction.CommitAsync();
                return hosts;
            }
            catch
            {
                await transaction.RollbackAsync();
                Db.ChangeTracker.Clear();
                throw;
            }
        }

        public Task<Hosts?> GetByIdAsync(int hostId)
        {
            return Db.Hosts.Include(host => host.Address).AsNoTracking()
                .FirstOrDefaultAsync(host => host.Id == hostId && host.IsActive);
        }

        public Task<Hosts?> VerificationbyId(int hostId, string userId)
        {
            return Db.Hosts.Include(host => host.Address).FirstOrDefaultAsync(h =>
                h.Id == hostId && h.UserId == userId && h.IsActive);
        }

        public async Task<Hosts> EditAsync(Hosts host)
        {
            await using var transaction = await Db.Database.BeginTransactionAsync();
            // Desativação não deve revalidar CNPJ legado; create/alteração de CNPJ são protegidos.
            if (Db.Entry(host).Property(item => item.CNPJ).OriginalValue != host.CNPJ)
            {
                await CheckCnpjForSaveAsync(host);
            }
            if (host.Address.Id == 0)
            {
                Db.Addresses.Add(host.Address);
            }
            await Db.SaveChangesAsync();
            await transaction.CommitAsync();
            return host;
        }

        public async Task<bool> UserOwnsActiveHostAsync(Programming programming, string userId)
        {
            var host = await Db.Hosts.AnyAsync(h => h.Id == programming.HostId && h.UserId == userId && h.IsActive == true);
            return host;
        }

        public async Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userId)
        {
            return await Db.Hosts.Include(host => host.Address).Where(h => h.UserId == userId && h.IsActive == true).ToListAsync();
        }
    }
}
