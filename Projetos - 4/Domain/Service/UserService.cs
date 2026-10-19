using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Microsoft.AspNetCore.Identity;
using Projetos___4.Domain.Interfaces;

namespace Projetos___4.Domain.Service
{
    public class UserService: IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly IUserRepository _userRepository;

        public UserService(UserManager<User> userManager, IUserRepository userRepository)
        {
            _userManager = userManager;
            _userRepository = userRepository;
        }

        public async Task<IdentityResult> Create(User user, string password)
        {
            return await _userManager.CreateAsync(user, password);
        }

        public async Task<IdentityResult?> EditUserAsync(User user, string userId)
        {
            var existing = await GetProfileAsync(userId);

            if (existing == null)
            {
                return null;
            }

            existing.UserName = user.UserName;
            existing.Email = user.Email;
            existing.Typeofuser = user.Typeofuser;

            return await _userManager.UpdateAsync(existing);
        }

        public async Task<User?> GetProfileAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return null;
            }

            var user = await _userRepository.GetbyId(userId);

            if (user == null || !user.IsActive)
            {
                return null;
            }

            return user;
        }
    }
}
