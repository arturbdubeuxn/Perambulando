using Microsoft.AspNetCore.Identity;
using Projetos___4.Domain.Interfaces;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model.Host;
using Projetos___4.Domain.Model.OpeningDay;
using Projetos___4.Domain.Model.User;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Service;

public class OpeningHoursService : IOpeningHoursService
{
    private readonly IUserRepository _userRepository;
    private readonly UserManager<User> _userManager;
    private readonly IHostRepository _hostRepository;
    private readonly IOpeningHoursRepository _openingHoursRepository;
    private readonly IOpeningHoursValidations _openingHoursValidations;

    public OpeningHoursService(IUserRepository userRepository, UserManager<User> userManager,
        IHostRepository hostRepository, IOpeningHoursRepository openingHoursRepository,
        IOpeningHoursValidations openingHoursValidations)
    {
        _userRepository = userRepository;
        _userManager = userManager;
        _hostRepository = hostRepository;
        _openingHoursRepository = openingHoursRepository;
        _openingHoursValidations = openingHoursValidations;
    }

    public async Task<List<HostOpeningDay>> GetByHostIdAsync(int hostId, string userId)
    {
        await VerifyHostAsync(hostId, userId);

        return await _openingHoursRepository.GetByHostIdAsync(hostId);
    }

    public async Task<List<HostOpeningDay>> EditAsync(List<HostOpeningDay> days, int hostId, string userId)
    {
        ArgumentNullException.ThrowIfNull(days);
        await VerifyHostAsync(hostId, userId);

        _openingHoursValidations.ValidateWeek(days);
        if (days.Any(day => day.HostId != hostId))
        {
            throw new ArgumentException("Todos os dias devem pertencer ao host informado.");
        }

        return await _openingHoursRepository.EditAsync(days, hostId);
    }

    private async Task<Hosts> VerifyHostAsync(int hostId, string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuário indisponível.");
        }

        if (hostId <= 0)
        {
            throw new ArgumentException("O ID do host deve ser maior que zero.");
        }

        var user = await _userRepository.GetbyId(userId);
        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Usuário indisponível.");
        }

        var isAdmin = await _userManager.IsInRoleAsync(user, "ADMIN");
        var host = isAdmin
            ? await _hostRepository.GetByIdAsync(hostId)
            : await _hostRepository.VerificationbyId(hostId, userId);
        if (host == null)
        {
            throw new KeyNotFoundException("Host não encontrado ou indisponível para este usuário.");
        }

        if (host.Typeofhost != Hosts.TypeofHost.Gastronomy && host.Typeofhost != Hosts.TypeofHost.Business)
        {
            throw new ArgumentException("O funcionamento semanal está disponível somente para hosts de gastronomia e comércio.");
        }

        return host;
    }
}
