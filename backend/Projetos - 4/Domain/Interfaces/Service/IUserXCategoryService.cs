using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IUserXCategoryService
    {
        Task<List<UserXCategory>> AddAsync(string userId, IReadOnlyCollection<UserXCategory> userCategories);
        Task<List<UserXCategory>> EditAsync(string userId, IReadOnlyCollection<UserXCategory> userCategories);
    }
}
