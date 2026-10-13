using Projetos___4._3___Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IHostRepository
    {
        Task<OperationResult<Hosts>> Create(Hosts host);
    }
}
