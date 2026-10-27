using Microsoft.AspNetCore.Mvc;
using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Interfaces
{
    public interface IProgrammingAppService
    {
        Task<List<ProgrammingResponseDTO>> GetAllProgrammingsAsync(int take, int skip);
        Task<ProgrammingDetailsDTO?> GetByIdAsync(int programmingId);
        Task<ProgrammingResponseDTO?> DeleteProgrammingAsync(int id, int hostId, string userId);
        Task<IEnumerable<ProgrammingResponseDTO>> GetAllProgrammingsbyHostId(int hostId);
        Task<List<ProgrammingResponseDTO>> GetAllProgrammingsByUserCategoriesAsync(string userId);
        Task<ProgrammingResponseDTO> CreateProgrammingAsync(ProgrammingDTO programmingCreateDTO, int hostId, string userId);
        Task<ProgrammingResponseDTO?> EditProgrammingAsync(ProgrammingDTO dto, int id, int hostId, string userId);
        Task<List<ProgrammingResponseDTO>> FilterAsync(ProgrammingFilterDTO dto);
        Task<List<ProgrammingResponseDTO>> GetAllProgrammingsWithProHost(int take, int skip);


    }
}
