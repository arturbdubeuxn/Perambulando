using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Interfaces
{
    public interface IProgrammingAppService
    {
        Task<ProgrammingDetailsDTO?> GetByIdAsync(int programmingId);
        Task<Programming?> DeleteProgrammingAsync(int id, int hostId, string userId);
        Task<IEnumerable<Programming>> GetAllProgrammingsbyHostId(int hostId, string userId);
        Task<Programming> CreateProgrammingAsync(ProgrammingCreateDTO programmingCreateDTO, int hostId, string userId);
        Task<Programming?> EditProgrammingAsync(ProgrammingEditDTO dto, int id, int hostId, string userId);

        Task<List<Programming>> GetAllProgrammingsByUserCategoriesAsync(string userId);
    }
}
