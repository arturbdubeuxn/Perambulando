using Projetos___4.Application.Mapping.Interfaces;
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
        private readonly IValidation<UserDTO> _userValidation;
        private readonly IUserMapping _userMapping;
        private readonly ISubscriptionService _subscriptionService;

        public UserAppService(IUserService userService, IValidation<UserDTO> userValidation, IUserMapping userMapping, ISubscriptionService subscriptionService)
        {
            _subscriptionService = subscriptionService;
            _userMapping = userMapping;
            _userService = userService;
            _userValidation = userValidation;
        }

        public async Task<UserProfileDTO?> GetProfileAsync(string userId)
        {
            var user = await _userService.GetProfileAsync(userId);
            if (user == null)
            {
                return null;
            }

            var isPro = await _subscriptionService.IsProAsync(user.Id);
            return _userMapping.ToDTO(user, isPro);
        }

        public Task<IdentityResult?> EditUserAsync(UserDTO dto, string userId)
        {
            _userValidation.Validate(dto, DateTime.UtcNow);
            var user = _userMapping.ToEditModel(dto);
            return _userService.EditUserAsync(user, userId);
        }

        public async Task<IdentityResult> Create(UserDTO dto)
        {
            _userValidation.Validate(dto, DateTime.UtcNow);
            var newUser = _userMapping.ToModel(dto);
            return await _userService.Create(newUser, dto.Password ?? string.Empty);
        }
    }
}
