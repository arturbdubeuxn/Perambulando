using Projetos___4.Application.DTO.HostsPhoto;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping;
public class HostsPhotosMapping : IHostsPhotosMapping
{
    public HostsPhotos ToModel(HostPhotoCreateDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new HostsPhotos { HostId = dto.HostId, PhotoUrl = dto.PhotoUrl };
    }
    public HostPhotoResponse ToDTO(HostsPhotos photo)
    {
        ArgumentNullException.ThrowIfNull(photo);
        return new HostPhotoResponse { Id = photo.Id, HostId = photo.HostId, PhotoUrl = photo.PhotoUrl };
    }
}
