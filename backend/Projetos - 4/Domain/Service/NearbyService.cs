using NetTopologySuite.Geometries;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;
namespace Projetos___4.Domain.Service;
public class NearbyService : INearbyService
{
    private readonly INearbyRepository _nearbyRepository;
    private readonly IHostRepository _hostRepository;
    private readonly IProgrammingRepository _programmingRepository;
    private readonly INearbyValidations _validations;
    public NearbyService(INearbyRepository nearbyRepository, IHostRepository hostRepository,
        IProgrammingRepository programmingRepository, INearbyValidations validations)
    {
        _nearbyRepository = nearbyRepository; _hostRepository = hostRepository;
        _programmingRepository = programmingRepository; _validations = validations;
    }
    public async Task<List<NearbyItem>> GetNearMeAsync(NearbyFilter filter)
    {
        _validations.Validate(filter);
        var origin = new Point(filter.Longitude!.Value, filter.Latitude!.Value) { SRID = 4326 };
        var (min, max) = filter.DistanceRange switch
        {
            NearbyFilter.NearbyDistanceRange.From2To5Km => (2000, 5000),
            NearbyFilter.NearbyDistanceRange.From5To10Km => (5000, 10000),
            NearbyFilter.NearbyDistanceRange.From10To20Km => (10000, 20000),
            _ => (0, 2000)
        };
        return await _nearbyRepository.GetNearbyAsync(origin, min, max, filter);
    }
    public async Task<List<NearbyItem>> GetNearHostAsync(int hostId, NearbyFilter filter)
    {
        _validations.ValidateDestination(hostId, filter.Skip);
        var host = await _hostRepository.GetByIdAsync(hostId);
        if (host == null || !host.IsActive)
        {
            throw new KeyNotFoundException("Host indisponível.");
        }
        var origin = GetOrigin(host.Address?.Location);
        return await _nearbyRepository.GetNearbyAsync(origin, 0, 2000, filter, excludedHostId: hostId);
    }
    public async Task<List<NearbyItem>> GetNearProgrammingAsync(int programmingId, NearbyFilter filter)
    {
        _validations.ValidateDestination(programmingId, filter.Skip);
        var programming = await _programmingRepository.GetByIdAsync(programmingId);
        if (programming == null || !programming.IsActive || programming.Host == null || !programming.Host.IsActive)
        {
            throw new KeyNotFoundException("Programação indisponível.");
        }
        var origin = GetOrigin(programming.Address?.Location);
        return await _nearbyRepository.GetNearbyAsync(origin, 0, 2000, filter, excludedProgrammingId: programmingId);
    }
    private Point GetOrigin(Point? location)
    {
        if (location == null || location.IsEmpty || location.SRID != 4326 ||
            !double.IsFinite(location.X) || !double.IsFinite(location.Y) ||
            location.X < -180 || location.X > 180 || location.Y < -90 || location.Y > 90)
        {
            throw new NearbyLocationException();
        }
        return location;
    }
}
