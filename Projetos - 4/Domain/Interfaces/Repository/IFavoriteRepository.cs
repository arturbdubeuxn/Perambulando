using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IFavoriteRepository
    {
        Task<Favorite> AddAsync(string userId, int programmingId);
        Task<List<Favorite>> GetAllByUserIdAsync(string userId);
        Task<Favorite?> DeleteAsync(string userId, int programmingId);
    }
}
