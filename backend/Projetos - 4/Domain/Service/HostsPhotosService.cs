using Projetos___4.Domain.Model;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
namespace Projetos___4.Domain.Service;
public class HostsPhotosService : IHostsPhotosService
{
    private readonly IHostsPhotosRepository _photosRepository;
    private readonly IHostService _hostService;
    public HostsPhotosService(IHostsPhotosRepository photosRepository,IHostService hostService)
    {
        _photosRepository = photosRepository;
        _hostService = hostService;
    }
    public async Task<List<HostsPhotos>> GetAllAsync(int hostId)
    {
        var host = await _hostService.GetByIdAsync(hostId);
        if (host == null)
        {
            throw new Exception("Host not found.");
        }
        return await _photosRepository.GetAllAsync(hostId);
    }
    public async Task<HostsPhotos> CreateAsync(HostsPhotos photo, string userId)
    {
        ArgumentNullException.ThrowIfNull(photo);
        var host = await _hostService.HostVerification(photo.HostId, userId);
        if (host == null)
        {
            throw new UnauthorizedAccessException("Host not found or user is not authorized to add photos.");
        }
        if (string.IsNullOrWhiteSpace(photo.PhotoUrl))
        {
            throw new ArgumentException("A URL da foto não pode ser nula ou vazia.");
        }
        if(host.Typeofhost != Hosts.TypeofHost.Gastronomy && host.Typeofhost != Hosts.TypeofHost.Business)
        {
            throw new ArgumentException("A galeria está disponível somente para gastronomia e comércio.");
        }
        photo.CreateAt = DateTime.UtcNow;
        return await _photosRepository.CreateAsync(photo);
    }
    public async Task DeleteAsync(int photoId, string userId)
    {
        if (photoId <= 0)
        {
            throw new ArgumentException("O ID da foto deve ser maior que zero.");
        }
        var photo = await _photosRepository.GetByIdAsync(photoId)
            ?? throw new KeyNotFoundException("Foto não encontrada ou inativa.");
        var host = await _hostService.HostVerification(photo.HostId, userId);
        if (host == null)
        {
            throw new UnauthorizedAccessException("Você não tem permissão para remover esta foto.");
        }

        photo.IsActive = false;
        await _photosRepository.DeleteAsync(photo);
    }
  
}
