using NetTopologySuite.Geometries;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service;

public interface IGeocodingService
{
    Task<Point> GeocodeAsync(GeocodingAddress address, CancellationToken cancellationToken = default);
}
