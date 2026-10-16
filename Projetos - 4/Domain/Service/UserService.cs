using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Microsoft.AspNetCore.Identity;

namespace Projetos___4.Domain.Service
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
