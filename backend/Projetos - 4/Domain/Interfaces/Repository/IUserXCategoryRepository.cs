using Projetos___4.Domain.Model.User;

namespace Projetos___4.Domain.Interfaces.Repository
{
    public interface IUserXCategoryRepository
    {
        Task<List<UserXCategory>> AddAsync(IReadOnlyCollection<UserXCategory> userCategories);
        Task<List<UserXCategory>> EditAsync(string userId, List<UserXCategory> linksToAdd, List<UserXCategory> linksToRemove,
            IReadOnlyCollection<int> expectedCategoryIds);
    }
}
