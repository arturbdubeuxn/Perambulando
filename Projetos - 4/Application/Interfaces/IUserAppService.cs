using Microsoft.AspNetCore.Identity;
using Projetos___4._2___Application.DTO;

namespace Projetos___4._2___Application.Interfaces
{
    public interface IUserAppService
    {
        Task<IdentityResult> Create(UserRegisterDTO dto);
    }
}
