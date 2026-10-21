using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IHostRepository
    {
        Task<Hosts?> Create(Hosts host);

        Task<Hosts?> GetByIdAsync(int hostId);

        Task<Hosts?> VerificationbyId(int hostId, string userId);

        Task<Hosts> EditAsync(Hosts host);

        Task<bool> UserOwnsActiveHostAsync(Programming programming, string userId);

        Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userId);
    }
}
