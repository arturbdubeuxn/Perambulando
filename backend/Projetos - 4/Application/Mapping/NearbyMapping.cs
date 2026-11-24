using Projetos___4.Application.DTO.NearBy;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping;
public class NearbyMapping : INearbyMapping
{
    public NearbyFilter ToModel(NearbyUserFilterDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new NearbyFilter { Latitude = dto.Latitude, Longitude = dto.Longitude, DistanceRange = dto.DistanceRange, Skip = dto.Skip };
    }
    public NearbyFilter ToModel(NearbyDestinationFilterDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new NearbyFilter { Skip = dto.Skip };
    }
    public NearbyResponseDTO ToDTO(List<NearbyItem> items, NearbyFilter filter, int pageSize = 10)
    {
        ArgumentNullException.ThrowIfNull(items);
        if (pageSize <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(pageSize));
        }
        return new NearbyResponseDTO
        {
            Skip = filter.Skip, PageSize = pageSize, HasMore = items.Count > pageSize,
            Items = items.Take(pageSize).Select(item => new NearbyItemResponseDTO
            {
                Id = item.Id, Type = item.TargetType == 0 ? "Host" : "Programming",
                Name = item.Name, Description = item.Description, Address = item.Address,
                ImageUrl = item.ImageUrl, DistanceMeters = item.DistanceMeters,
                Latitude = item.Latitude, Longitude = item.Longitude
            }).ToList()
        };
    }
}
