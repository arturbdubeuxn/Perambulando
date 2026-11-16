using Projetos___4.Application.DTO.Roadmap;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Mapping.Interfaces;

namespace Projetos___4.Application.AppServices
{

    public class RoadmapAppService : IRoadmapAppService
    {
        readonly IRoadmapService _roadmapService;
        readonly IRoadmapMapping _roadmapMapping;

        public RoadmapAppService(IRoadmapService roadmapService, IRoadmapMapping roadmapMapping)
        {
            _roadmapService = roadmapService;
            _roadmapMapping = roadmapMapping;
        }

        public async Task<RoadmapResponseDTO> CreateRoadmapAsync(RoadmapCreateDTO roadmapDTO, string? userId)
        {
            var obj = _roadmapMapping.ToModel(roadmapDTO, userId);
            var result = await _roadmapService.CreateRoadmapAsync(obj);
            return _roadmapMapping.ToDTO(result);
        }

        public Task<bool> DeleteRoadmapAsync(int roadmapId, string userId)
        {
            var result = _roadmapService.DeleteRoadmapAsync(roadmapId, userId);
            return result;
        }

        public async Task<List<RoadmapResponseDTO>> GetAllRoadmapsByUserIdAsync(string userId)
        {
            var result = await _roadmapService.GetAllRoadmapsByUserIdAsync(userId);
            return result.Select(r => _roadmapMapping.ToDTO(r)).ToList();
        }

        public async Task<RoadmapResponseDTO> GetRoadmapByIdAsync(int roadmapId)
        {
            var result = await _roadmapService.GetRoadmapByIdAsync(roadmapId);
            return _roadmapMapping.ToDTO(result);
        }

        public async Task<RoadmapResponseDTO> UpdateRoadmapAsync(int roadmapId, RoadmapCreateDTO roadmapDTO,string userId)
        {
            var obj = _roadmapMapping.ToModel(roadmapDTO, userId);
            var result = await _roadmapService.UpdateRoadmapAsync(roadmapId, obj, userId);
            return _roadmapMapping.ToDTO(result);
        }
    }
}


