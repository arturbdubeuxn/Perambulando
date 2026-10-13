using Microsoft.AspNetCore.Identity;
using Projetos___4._2___Application.DTO;
using Projetos___4._3___Domain.Interfaces;
using Projetos___4._3___Domain.Model;
using Projetos___4.Application.AppServices;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;

namespace Projetos___4.Domain.Service
{
    public class HostService : IHostService
    {
        private readonly UserManager<User> _userManager;
        private readonly IUserRepository _userRepository;
        private readonly IHostRepository _hostRepository;
        private readonly RoleManager<IdentityRole> _roleManager;
        public HostService(UserManager<User> userManager, IUserRepository userRepository, IHostRepository hostRepository, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _userRepository = userRepository;
            _hostRepository = hostRepository;
            _roleManager = roleManager;
        }


        public async Task<OperationResult<Hosts>> Create(Hosts host, string userId)
        {
            if (host == null)
            {
                throw new ArgumentNullException(nameof(host));
            }

            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));
            }

            var user = await _userRepository.GetbyId(userId);

            host.UserId = userId;

            if (user == null)
            {
                return new OperationResult<Hosts>(false, null, "User not found.");
            }

            if (!await _roleManager.RoleExistsAsync("HOST"))
                return new OperationResult<Hosts>(false, null, "Role HOST is not registered.");

            var result = await _hostRepository.Create(host);

            if (!result.Succeeded)
                return new OperationResult<Hosts>(false, null, result.Message);

            if (!await _userManager.IsInRoleAsync(user, "HOST"))
            {
                var roleResult = await _userManager.AddToRoleAsync(user, "HOST");
                if (!roleResult.Succeeded)
                    return new OperationResult<Hosts>(false, null,
                        "Host was saved, but role assignment failed: " +
                        string.Join("; ", roleResult.Errors.Select(error => error.Description)));
            }

            return new OperationResult<Hosts>(true, host, "Host created successfully.");
        }

    }
}
