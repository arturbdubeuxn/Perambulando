using Microsoft.AspNetCore.Identity;
using Projetos___4._3___Domain.Model;
using Projetos___4._2___Application.DTO;
using Projetos___4._2___Application.Interfaces;
using Projetos___4._3___Domain.Interfaces.Service;

namespace Projetos___4._2___Application.Services
{

    public class UserAppService : IUserAppService
    {
        private readonly IUserService _userService;
        public UserAppService(IUserService userService)
        {
            _userService = userService;
        }

        public async Task<IdentityResult> Create(UserRegisterDTO dto)
        {
            if (dto == null)
            {
                throw new ArgumentNullException(nameof(dto), "User data is invalid");
            }
            var newUser = new User
            {
                UserName = dto.Name,
                Email = dto.Email,
                Typeofuser = (User.TypeofUser)dto.TypeofUser,
            };
            var result = await _userService.Create(newUser, dto.Password);
            return result;
        }
    }
}
