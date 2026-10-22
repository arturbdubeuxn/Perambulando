using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IUserXCategoryRepository
    {
        Task<UserXCategory?> AddAsync(UserXCategory userXCategory);
        Task<List<UserXCategory>> EditAsync(string userId, List<UserXCategory> linksToAdd, List<UserXCategory> linksToRemove);
    }
}
