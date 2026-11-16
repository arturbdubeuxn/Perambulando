using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Interfaces.Service;
public interface IHostsPhotosService
{
    Task<List<HostsPhotos>> GetAllAsync(int hostId);
    Task<HostsPhotos> CreateAsync(HostsPhotos photo, string userId);
    Task DeleteAsync(int photoId, string userId);
}
