using Projetos___4._3___Domain.Interfaces.Service;
using Projetos___4._3___Domain.Model;
using Microsoft.AspNetCore.Identity;

namespace Projetos___4._3___Domain.Service
{
    public class UserService: IUserService
    {
        private readonly UserManager<User> _userManager;

        public UserService(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<IdentityResult> Create(User user, string password)
        {
            return await _userManager.CreateAsync(user, password);
        }
    }
}
