using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Interfaces.Service;
public interface INearbyService
{
    Task<List<NearbyItem>> GetNearMeAsync(NearbyFilter filter);
    Task<List<NearbyItem>> GetNearProgrammingAsync(int programmingId, NearbyFilter filter);
    Task<List<NearbyItem>> GetNearHostAsync(int hostId, NearbyFilter filter);
}
