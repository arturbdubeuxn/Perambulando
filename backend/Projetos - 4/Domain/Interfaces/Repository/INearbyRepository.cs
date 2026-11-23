using NetTopologySuite.Geometries;
using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Interfaces.Repository;
public interface INearbyRepository
{
    Task<List<NearbyItem>> GetNearbyAsync(Point origin, int minMeters, int maxMeters, NearbyFilter filter,
        int? excludedHostId = null, int? excludedProgrammingId = null);
    Task<List<NearbyItem>> GetNearestProgrammingsAsync(Point origin, int excludedProgrammingId, int skip, int take);
}
