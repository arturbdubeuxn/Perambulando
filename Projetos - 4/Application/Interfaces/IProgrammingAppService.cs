using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Interfaces
{
    public interface IProgrammingAppService
    {
        Task<ProgrammingDetailsDTO?> GetByIdAsync(int programmingId);
        Task<OperationResult<Programming>> DeleteProgrammingAsync(int id, int hostId, string userId);
        Task<OperationResult<IEnumerable<Programming>>> GetAllProgrammingsbyHostId(int hostId, string userId);
        Task<Programming> CreateProgrammingAsync(ProgrammingCreateDTO programmingCreateDTO, int hostId, string userId);
        Task<OperationResult<Programming>> EditProgrammingAsync(ProgrammingEditDTO dto, int id, int hostId, string userId);
    }
}
