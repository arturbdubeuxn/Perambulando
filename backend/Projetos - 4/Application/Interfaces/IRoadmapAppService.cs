using Projetos___4.Application.DTO.Roadmap;

namespace Projetos___4.Application.Interfaces
{
    public interface IRoadmapAppService
    {
        Task<List<RoadmapResponseDTO>> GetAllRoadmapsByUserIdAsync(string userId);

        Task<RoadmapResponseDTO> GetRoadmapByIdAsync(int roadmapId);

        Task<RoadmapResponseDTO> CreateRoadmapAsync(RoadmapCreateDTO roadmapDTO, string? userId);

        Task<RoadmapResponseDTO> UpdateRoadmapAsync(int roadmapId, RoadmapCreateDTO roadmapDTO, string userId);

        Task<bool> DeleteRoadmapAsync(int roadmapId, string userId);

    }
}


