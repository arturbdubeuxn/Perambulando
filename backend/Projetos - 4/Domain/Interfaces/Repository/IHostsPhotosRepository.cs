using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Interfaces.Repository;
public interface IHostsPhotosRepository
{
    Task<List<HostsPhotos>> GetAllAsync(int hostId);
    Task<HostsPhotos?> GetByIdAsync(int photoId);
    Task<HostsPhotos> CreateAsync(HostsPhotos photo);
    Task DeleteAsync(HostsPhotos photo);
}
