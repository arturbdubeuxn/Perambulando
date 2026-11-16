using Microsoft.EntityFrameworkCore;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Interfaces.Repository;
namespace Projetos___4.Data.Repository;
public class HostsPhotosRepository : IHostsPhotosRepository
{
    private readonly Context.Context Db;
    public HostsPhotosRepository(Context.Context db) { Db = db; }
    public Task<List<HostsPhotos>> GetAllAsync(int hostId)
    {
        return Db.HostsPhotos.AsNoTracking().Where(p => p.HostId == hostId && p.IsActive)
            .OrderBy(p => p.CreateAt).ThenBy(p => p.Id).ToListAsync();
    }
    public Task<HostsPhotos?> GetByIdAsync(int photoId)
    {
        return Db.HostsPhotos.FirstOrDefaultAsync(p => p.Id == photoId && p.IsActive);
    }
    public async Task<HostsPhotos> CreateAsync(HostsPhotos photo)
    {
        Db.HostsPhotos.Add(photo);
        await Db.SaveChangesAsync();
        return photo;
    }
    public async Task DeleteAsync(HostsPhotos photo)
    {
        await Db.SaveChangesAsync();
    }
}
