using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.DTO;
using Projetos___4.Domain.Interfaces;
using Projetos___4.Domain.Model;
using Projetos___4.Application.AppServices;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Projetos___4.Domain.Service
{
    public class HostService : IHostService
    {
        private readonly UserManager<User> _userManager;
        private readonly IUserRepository _userRepository;
        private readonly IHostRepository _hostRepository;
        private readonly IAddressService _addressService;
        private readonly RoleManager<IdentityRole> _roleManager;
        public HostService(UserManager<User> userManager, IUserRepository userRepository, IHostRepository hostRepository, RoleManager<IdentityRole> roleManager, IAddressService addressService)
        {
            _userManager = userManager;
            _userRepository = userRepository;
            _hostRepository = hostRepository;
            _addressService = addressService;
            _roleManager = roleManager;
        }


        public async Task<Hosts?> Create(Hosts host, string userId)
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
                throw new InvalidOperationException("User not found.");
            }

            if (!await _roleManager.RoleExistsAsync("HOST"))
                throw new InvalidOperationException("Role HOST is not registered.");

            host.Address = await _addressService.AddAddress(host.AddressId, host.Address, userId);
            host.AddressId = host.Address.Id;

            var result = await _hostRepository.Create(host);

            if (result == null)
                throw new InvalidOperationException("Failed to create host.");

            if (!await _userManager.IsInRoleAsync(user, "HOST"))
            {
                var roleResult = await _userManager.AddToRoleAsync(user, "HOST");
                if (!roleResult.Succeeded)
                    throw new InvalidOperationException("Host was saved, but role assignment failed.");
            }

            return (host);
        }

        public Task<Hosts?> GetByIdAsync(int hostId)
        {
            return _hostRepository.GetByIdAsync(hostId);
        }

        public async Task<Hosts?> EditHostAsync(Hosts host, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return null;
            }

            var existing = await _hostRepository.VerificationbyId(host.Id, userId);

            if (existing == null)
            {
                return null;
            }

            var address = await _addressService.AddAddress(host.AddressId, host.Address, userId);

            existing.Typeofhost = host.Typeofhost;
            existing.CNPJ = host.CNPJ;
            existing.LogoUrl = host.LogoUrl;
            existing.InstagranUrl = host.InstagranUrl;
            existing.Address = address;
            existing.AddressId = address.Id;
            existing.Phone = host.Phone;
            existing.Name = host.Name;
            existing.Description = host.Description;
            existing.UpdatedAt = DateTime.UtcNow;

            return await _hostRepository.EditAsync(existing);
        }

        public async Task<Hosts?> DeleteHostAsync(int hostId, string userId)
        {
            if (hostId <= 0 || string.IsNullOrWhiteSpace(userId))
            {
                return null;
            }

            var host = await _hostRepository.VerificationbyId(hostId, userId);

            if (host == null)
            {
                return null;
            }

            host.IsActive = false;
            host.UpdatedAt = DateTime.UtcNow;

            return await _hostRepository.EditAsync(host);
        }

        public async Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userId)
        {
            return await _hostRepository.GetAllHostsbyUserId(userId);
        }

    }
}
