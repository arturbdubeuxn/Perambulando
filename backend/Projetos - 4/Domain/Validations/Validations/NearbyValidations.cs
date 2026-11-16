using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;
namespace Projetos___4.Domain.Validations.Validations;
public class NearbyValidations : INearbyValidations
{
    private readonly IUserService _userService;
    public NearbyValidations(IUserService userService) { _userService = userService; }
    public async Task ValidateUserAsync(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuário indisponível.");
        }
        var user = await _userService.GetProfileAsync(userId);
        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Usuário indisponível.");
        }
    }
    public void Validate(NearbyFilter filter)
    {
        ArgumentNullException.ThrowIfNull(filter);
        if (!filter.Latitude.HasValue || !filter.Longitude.HasValue ||
            !double.IsFinite(filter.Latitude.Value) || !double.IsFinite(filter.Longitude.Value) ||
            filter.Latitude < -90 || filter.Latitude > 90 || filter.Longitude < -180 || filter.Longitude > 180)
        {
            throw new ArgumentException("Informe latitude e longitude válidas.");
        }
        if (!Enum.IsDefined(filter.DistanceRange) || filter.Skip < 0)
        {
            throw new ArgumentException("Informe uma faixa válida e Skip maior ou igual a zero.");
        }
    }
    public void ValidateDestination(int id, int skip)
    {
        if (id <= 0 || skip < 0)
        {
            throw new ArgumentException("Informe ID maior que zero e Skip maior ou igual a zero.");
        }
    }
}
