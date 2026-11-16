using Projetos___4.Application.DTO.NearBy;
namespace Projetos___4.Application.Interfaces;
public interface INearbyAppService
{
    Task<NearbyResponseDTO> GetNearMeAsync(NearbyUserFilterDTO dto);
    Task<NearbyResponseDTO> GetNearProgrammingAsync(int programmingId, NearbyDestinationFilterDTO dto);
    Task<NearbyResponseDTO> GetNearHostAsync(int hostId, NearbyDestinationFilterDTO dto);
}
