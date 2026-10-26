using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Validations.Interface;
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
        private readonly ICnpjValidations _cnpjValidations;
        private readonly ICompanyRegistrationService _companyRegistrationService;
        private readonly UserManager<User> _userManager;
        private readonly IUserRepository _userRepository;
        private readonly IHostRepository _hostRepository;
        private readonly IAddressService _addressService;
        private readonly RoleManager<IdentityRole> _roleManager;
        public HostService(UserManager<User> userManager, IUserRepository userRepository, IHostRepository hostRepository, RoleManager<IdentityRole> roleManager, IAddressService addressService, ICnpjValidations cnpjValidations, ICompanyRegistrationService companyRegistrationService)
        {
            _cnpjValidations = cnpjValidations;
            _companyRegistrationService = companyRegistrationService;
            _userManager = userManager;
            _userRepository = userRepository;
            _hostRepository = hostRepository;
            _addressService = addressService;
            _roleManager = roleManager;
        }


        public async Task<CompanyRegistration> GetByCnpjAsync(string cnpj, CancellationToken cancellationToken = default)
        {
            var normalized = _cnpjValidations.ValidateCnpj(cnpj);
            var company = await _companyRegistrationService.GetByCnpjAsync(normalized, cancellationToken);
            if (company == null)
            {
                throw new CnpjException(CnpjFailure.NotFound, "CNPJ não localizado na base consultada. A base pode estar desatualizada.");
            }
            return company;
        }

        private async Task<string> ValidateHostCnpjAsync(string cnpj, int hostId, string? previousCnpj = null)
        {
            var normalized = _cnpjValidations.ValidateCnpj(cnpj);
            if (await _hostRepository.CnpjExistsAsync(normalized, hostId))
            {
                throw new CnpjException(CnpjFailure.Duplicate, "Já existe um host cadastrado com este CNPJ.");
            }
            var previous = previousCnpj?.Trim().Replace(".", "").Replace("/", "").Replace("-", "").ToUpperInvariant();
            if (previous != normalized)
            {
                var company = await GetByCnpjAsync(normalized);
                if (company.RegistrationStatus != 2)
                {
                    throw new CnpjException(CnpjFailure.Inactive, "O CNPJ precisa estar ativo na base consultada para cadastrar o host.");
                }
            }
            return normalized;
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

            host.CNPJ = await ValidateHostCnpjAsync(host.CNPJ, 0);
            host.Address = await _addressService.AddAddress(host.AddressId, host.Address, userId);
            host.AddressId = host.Address.Id;

            var result = await _hostRepository.Create(host, async () =>
            {
                    var roleResult = await _userManager.AddToRoleAsync(user, "HOST");
                    if (!roleResult.Succeeded)
                    {
                        throw new InvalidOperationException("Host role assignment failed.");
                    }
            });

            if (result == null)
            {
                throw new InvalidOperationException("Failed to create host.");
            }

            return result;
        }

        public Task<Hosts?> GetByIdAsync(int hostId)
        {
            return _hostRepository.GetByIdAsync(hostId);
        }

        private async Task<Hosts?> HostVerification(int hostId, string userId)
        {
            if (hostId <= 0 || string.IsNullOrWhiteSpace(userId))
            {
                return null;
            }

            var user = await _userRepository.GetbyId(userId);
            if (user == null || !user.IsActive)
            {
                return null;
            }

            var isAdmin = await _userManager.IsInRoleAsync(user, "ADMIN");
            return await _hostRepository.VerificationbyId(hostId, userId, isAdmin);
        }

        public async Task<Hosts?> EditHostAsync(Hosts host, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return null;
            }

            var existing = await HostVerification(host.Id, userId);

            if (existing == null)
            {
                return null;
            }

            host.CNPJ = await ValidateHostCnpjAsync(host.CNPJ, existing.Id, existing.CNPJ);
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

            var host = await HostVerification(hostId, userId);

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
