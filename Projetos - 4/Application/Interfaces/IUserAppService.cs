using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Interfaces
{
    public interface IUserAppService
    {
        Task<IdentityResult> Create(UserRegisterDTO dto);

        Task<UserProfileDTO?> GetProfileAsync(string userId);

        Task<IdentityResult?> EditUserAsync(UserEditDTO dto, string userId);
    }
}
