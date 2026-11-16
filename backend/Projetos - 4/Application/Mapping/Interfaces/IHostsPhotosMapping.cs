using Projetos___4.Application.DTO.HostsPhoto;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping.Interfaces;
public interface IHostsPhotosMapping
{
    HostsPhotos ToModel(HostPhotoCreateDTO dto);
    HostPhotoResponse ToDTO(HostsPhotos photo);
}
