using Microsoft.AspNetCore.Identity;
using Projetos___4._3___Domain.Model;

namespace Projetos___4._3___Domain.Interfaces.Service
{
    public interface IUserService
    {
        Task<IdentityResult> Create(User user, string password);
    }
}
