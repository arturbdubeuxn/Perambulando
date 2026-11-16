using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.DTO.User;

namespace Projetos___4.Application.Interfaces
{
    public interface IUserAppService
    {
        Task<IdentityResult> Create(UserDTO dto);

        Task<UserProfileDTO?> GetProfileAsync(string userId);

        Task<IdentityResult?> EditUserAsync(UserDTO dto, string userId);
        Task<IdentityResult?> DeleteUserAsync(UserDeleteDTO dto, string userId);
    }
}
