using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Interfaces
{
    public interface IUserAppService
    {
        Task<IdentityResult> Create(UserDTO dto);

        Task<UserProfileDTO?> GetProfileAsync(string userId);

        Task<IdentityResult?> EditUserAsync(UserDTO dto, string userId);
    }
}
