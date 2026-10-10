using Projetos___4._3___Domain.Model;

namespace Projetos___4._3___Domain.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetbyId(string id);
    }
}
