using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IProgrammingService
    {
        Task<Programming?> GetByIdAsync(int programmingId);
        Task<OperationResult<Programming>> DeleteProgrammingAsync(int id, int hostId, string userId);
        Task<OperationResult<IEnumerable<Programming>>> GetAllProgrammingsbyHostId(int hostId, string userId);
        Task<Programming> CreateProgrammingAsync(Programming programming, List<ProgrammingXCategory> links, string userId);
        Task<OperationResult<Programming>> EditProgrammingAsync(Programming programming, string userId);
    }
}
