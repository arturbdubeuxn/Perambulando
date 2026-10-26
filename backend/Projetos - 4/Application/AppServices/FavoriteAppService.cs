using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.AppServices
{
    public class FavoriteAppService : IFavoriteAppService
    {
        private readonly IFavoriteService _favoriteService;

        private readonly IFavoriteMapping _favoriteMapping;

        public FavoriteAppService(IFavoriteService favoriteService, IFavoriteMapping favoriteMapping)
        {
            _favoriteMapping = favoriteMapping;
            _favoriteService = favoriteService;
        }

        public async Task<FavoriteResponseDTO> AddAsync(string? userId, int programmingId)
        {
            var favorite = _favoriteMapping.ToModel(userId ?? string.Empty, programmingId);
            var result = await _favoriteService.AddAsync(favorite);
            return _favoriteMapping.ToDTO(result);
        }

        public async Task<List<FavoriteResponseDTO>> GetAllByUserIdAsync(string? userId)
        {
            var favorites = await _favoriteService.GetAllByUserIdAsync(userId);
            return favorites.Select(_favoriteMapping.ToDTO).ToList();
        }

        public async Task<FavoriteResponseDTO> DeleteAsync(string? userId, int programmingId)
        {
            var favorite = await _favoriteService.DeleteAsync(userId, programmingId);
            return _favoriteMapping.ToDTO(favorite);
        }
    }
}
