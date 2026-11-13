using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IFavoriteService
    {
        Task<Favorite> AddAsync(Favorite favorite);
        Task<List<Favorite>> GetAllByUserIdAsync(string? userId);
        Task<Favorite> DeleteAsync(string userId, int programmingId);
    }
}
