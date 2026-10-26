using Microsoft.AspNetCore.Identity;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IUserService
    {
        Task<IdentityResult> Create(User user, string password);

        Task<User?> GetProfileAsync(string userId);

        Task<IdentityResult?> EditUserAsync(User user, string userId);
    }
}
