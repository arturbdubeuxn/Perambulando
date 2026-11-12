using Projetos___4.Domain.Interfaces.Service;
using Microsoft.AspNetCore.Identity;
using Projetos___4.Domain.Interfaces;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Model.Statistics;
using Projetos___4.Domain.Model.User;

namespace Projetos___4.Domain.Service
{
    public class UserService: IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly IUserRepository _userRepository;
        private readonly IHostRepository _hostRepository;
        private readonly IProgrammingRepository _programmingRepository;
        private readonly IFavoriteRepository _favoriteRepository;
        private readonly ISubscriptionRepository _subscriptionRepository;

        public UserService(UserManager<User> userManager, IUserRepository userRepository,
            IHostRepository hostRepository, IProgrammingRepository programmingRepository,
            IFavoriteRepository favoriteRepository, ISubscriptionRepository subscriptionRepository)
        {
            _userManager = userManager;
            _userRepository = userRepository;
            _hostRepository = hostRepository;
            _programmingRepository = programmingRepository;
            _favoriteRepository = favoriteRepository;
            _subscriptionRepository = subscriptionRepository;
        }

        public async Task<IdentityResult> Create(User user, string password)
        {
            if (string.IsNullOrWhiteSpace(password))
            {
                return IdentityResult.Failed(new IdentityError
                {
                    Code = "PasswordRequired",
                    Description = "Informe a senha para cadastrar o usuário."
                });
            }

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

        public async Task<IdentityResult?> DeleteUserAsync(string email, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new UnauthorizedAccessException("Usuário não autenticado.");
            }
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException("Informe o e-mail da sua conta.", nameof(email));
            }

            IdentityResult? result = null;
            await _userRepository.DeleteAsync(userId, async () =>
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    return false;
                }
                if (user.Id != userId)
                {
                    throw new UserForbiddenException();
                }
                if (!user.IsActive)
                {
                    return false;
                }

                var hosts = await _hostRepository.GetAllHostsbyUserId(userId);
                var programmings = await _programmingRepository.GetAllProgrammingsByUserIdAsync(userId);
                var favorites = await _favoriteRepository.GetAllForDeactivationAsync(userId);
                var subscription = await _subscriptionRepository.GetByUserIdAsync(userId);
                var now = DateTime.UtcNow;

                foreach (var host in hosts)
                {
                    host.IsActive = false;
                    host.UpdatedAt = now;
                }
                foreach (var programming in programmings)
                {
                    programming.IsActive = false;
                    programming.UpdateDate = now;
                }
                foreach (var favorite in favorites)
                {
                    favorite.IsActive = false;
                    favorite.UpdatedAt = now;
                }
                if (subscription != null && subscription.Status != SubscriptionStatus.Cancelled)
                {
                    subscription.Status = SubscriptionStatus.Cancelled;
                    subscription.CancelledAt = now;
                    subscription.UpdatedAt = now;
                }

                user.IsActive = false;
                result = await _userManager.UpdateAsync(user);
                return result.Succeeded;
            });

            return result;
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
