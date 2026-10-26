using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Interfaces
{
    public interface IFavoriteAppService
    {
        Task<FavoriteResponseDTO> AddAsync(string? userId, int programmingId);
        Task<List<FavoriteResponseDTO>> GetAllByUserIdAsync(string? userId);
        Task<FavoriteResponseDTO> DeleteAsync(string? userId, int programmingId);
    }
}
