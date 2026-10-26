using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IFavoriteRepository
    {
        Task<Favorite> AddAsync(Favorite favorite);
        Task<List<Favorite>> GetAllByUserIdAsync(string userId);
        Task<Favorite?> DeleteAsync(Favorite favorite);
        Task<Favorite?> GetFavoritebyUserAndProgrammingId(string userId, int programmingid);
    }
}
