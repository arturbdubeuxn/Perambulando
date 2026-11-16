using Projetos___4.Application.DTO.NearBy;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
namespace Projetos___4.Application.AppServices;
public class NearbyAppService : INearbyAppService
{
    private readonly INearbyService _nearbyService;
    private readonly INearbyMapping _nearbyMapping;
    public NearbyAppService(INearbyService nearbyService, INearbyMapping nearbyMapping)
    {
        _nearbyService = nearbyService;
        _nearbyMapping = nearbyMapping;
    }
    public async Task<NearbyResponseDTO> GetNearMeAsync(NearbyUserFilterDTO dto)
    {
        var filter = _nearbyMapping.ToModel(dto);
        var result = await _nearbyService.GetNearMeAsync(filter);
        return _nearbyMapping.ToDTO(result, filter);
    }
    public async Task<NearbyResponseDTO> GetNearProgrammingAsync(int programmingId, NearbyDestinationFilterDTO dto)
    {
        var filter = _nearbyMapping.ToModel(dto);
        var result = await _nearbyService.GetNearProgrammingAsync(programmingId, filter);
        return _nearbyMapping.ToDTO(result, filter);
    }
    public async Task<NearbyResponseDTO> GetNearHostAsync(int hostId, NearbyDestinationFilterDTO dto)
    {
        var filter = _nearbyMapping.ToModel(dto);
        var result = await _nearbyService.GetNearHostAsync(hostId, filter);
        return _nearbyMapping.ToDTO(result, filter);
    }
}
