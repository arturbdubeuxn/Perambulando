using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Interfaces
{
    public interface IProgrammingAppService
    {
        Task<ProgrammingDetailsDTO?> GetByIdAsync(int programmingId);
        Task<ProgrammingResponseDTO?> DeleteProgrammingAsync(int id, int hostId, string userId);
        Task<IEnumerable<ProgrammingResponseDTO>> GetAllProgrammingsbyHostId(int hostId, string userId);
        Task<ProgrammingResponseDTO> CreateProgrammingAsync(ProgrammingCreateDTO programmingCreateDTO, int hostId, string userId);
        Task<ProgrammingResponseDTO?> EditProgrammingAsync(ProgrammingEditDTO dto, int id, int hostId, string userId);

        Task<List<ProgrammingResponseDTO>> GetAllProgrammingsByUserCategoriesAsync(string userId);
    }
}
