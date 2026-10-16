using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IHostRepository
    {
        Task<OperationResult<Hosts>> Create(Hosts host);

        Task<bool> UserOwnsActiveHostAsync(Programming programming, string userId);

        Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userId);
    }
}
