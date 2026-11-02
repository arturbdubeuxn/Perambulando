using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetbyId(string id);
        Task<bool> DeleteAsync(string userId, Func<Task<bool>> deactivate);
    }
}
