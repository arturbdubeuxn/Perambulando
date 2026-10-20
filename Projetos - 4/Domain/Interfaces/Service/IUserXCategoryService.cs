using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IUserXCategoryService
    {
        Task<UserXCategory?> AddAsync(UserXCategory userXCategory);
    }
}
