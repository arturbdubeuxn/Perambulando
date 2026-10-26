using Projetos___4.Domain.Interfaces;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service
{
    public class FavoriteService : IFavoriteService
    {
        private readonly IFavoriteRepository _favoriteRepository;
        private readonly IProgrammingRepository _programmingRepository;
        private readonly IUserRepository _userRepository;

        public FavoriteService(IFavoriteRepository favoriteRepository,
            IProgrammingRepository programmingRepository, IUserRepository userRepository)
        {
            _favoriteRepository = favoriteRepository;
            _programmingRepository = programmingRepository;
            _userRepository = userRepository;
        }

        private async Task ValidateUserAsync(string? userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new UnauthorizedAccessException("Usuário não autenticado.");
            }

            var user = await _userRepository.GetbyId(userId);
            if (user == null || !user.IsActive)
            {
                throw new UnauthorizedAccessException("Usuário indisponível.");
            }
        }

        public async Task<Favorite> AddAsync(Favorite favorite)
        {
            ArgumentNullException.ThrowIfNull(favorite);
            await ValidateUserAsync(favorite.UserId);
            if (favorite.ProgrammingId <= 0)
            {
                throw new ArgumentException("O ID da programação deve ser maior que zero.");
            }

            var programming = await _programmingRepository.GetByIdAsync(favorite.ProgrammingId);
            if (programming == null || !programming.IsActive || !programming.Host.IsActive)
            {
                throw new KeyNotFoundException("Programação indisponível.");
            }

            favorite.IsActive = true;
            favorite.CreatedAt = DateTime.UtcNow; 
            favorite.UpdatedAt = DateTime.UtcNow; 

            return await _favoriteRepository.AddAsync(favorite);
        }

        public async Task<List<Favorite>> GetAllByUserIdAsync(string? userId)
        {
            await ValidateUserAsync(userId);
            return await _favoriteRepository.GetAllByUserIdAsync(userId!);
        }

        public async Task<Favorite> DeleteAsync(string userId, int programmingId)
        {
            await ValidateUserAsync(userId);
            if (programmingId <= 0)
            {
                throw new ArgumentException("O ID da programação deve ser maior que zero.");
            }

            var obj = await _favoriteRepository.GetFavoritebyUserAndProgrammingId(userId, programmingId);

            if(obj == null)
            {
                throw new ArgumentException("O ID da programação deve ser maior que zero.");
            }

            obj.IsActive = false;
            obj.UpdatedAt = DateTime.UtcNow;

            return await _favoriteRepository.DeleteAsync(obj);
        }
    }
}
