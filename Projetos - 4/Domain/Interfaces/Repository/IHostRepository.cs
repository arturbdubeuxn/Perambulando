using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IHostRepository
    {
        Task<bool> CnpjExistsAsync(string cnpj, int excludedHostId = 0);

        Task<Hosts?> Create(Hosts host, Func<Task> assignRole);

        Task<Hosts?> GetByIdAsync(int hostId);

        Task<Hosts?> VerificationbyId(int hostId, string userId, bool isAdmin = false);

        Task<Hosts> EditAsync(Hosts host);

        Task<bool> UserOwnsActiveHostAsync(Programming programming, string userId);

        Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userId);

        Task<List<Hosts>> FilterAsync(HostFilter filter);
    }
}
