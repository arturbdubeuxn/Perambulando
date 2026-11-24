using Projetos___4.Application.DTO.NearBy;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping.Interfaces;
public interface INearbyMapping
{
    NearbyFilter ToModel(NearbyUserFilterDTO dto);
    NearbyFilter ToModel(NearbyDestinationFilterDTO dto);
    NearbyResponseDTO ToDTO(List<NearbyItem> items, NearbyFilter filter, int pageSize = 10);
}
