using Projetos___4.Application.Validations.Interfaces;
using Microsoft.AspNetCore.Identity;
using Projetos___4.Domain.Model;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Interfaces.Service;

namespace Projetos___4.Application.AppServices
{

    public class UserAppService : IUserAppService
    {
        private readonly IUserService _userService;
        private readonly IValidation<UserRegisterDTO> _userCreateValidation;
        private readonly IValidation<UserEditDTO> _userEditValidation;
        public UserAppService(IUserService userService, IValidation<UserRegisterDTO> userCreateValidation, IValidation<UserEditDTO> userEditValidation)
        {
            _userService = userService;
            _userCreateValidation = userCreateValidation;
            _userEditValidation = userEditValidation;
        }

        public async Task<UserProfileDTO?> GetProfileAsync(string userId)
        {
            var user = await _userService.GetProfileAsync(userId);

            if (user == null)
            {
                return null;
            }

            return new UserProfileDTO
            {
                Id = user.Id,
                Name = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                TypeofUser = user.Typeofuser,
                IsPro = user.isPro,
                CreatedAt = user.CreatedAt
            };
        }

        public Task<IdentityResult?> EditUserAsync(UserEditDTO dto, string userId)
        {
            _userEditValidation.Validate(dto, DateTime.UtcNow);

            var user = new User
            {
                UserName = dto.Name.Trim(),
                Email = dto.Email.Trim(),
                Typeofuser = dto.TypeofUser!.Value
            };

            return _userService.EditUserAsync(user, userId);
        }

        public async Task<IdentityResult> Create(UserRegisterDTO dto)
        {
            _userCreateValidation.Validate(dto, DateTime.UtcNow);

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
