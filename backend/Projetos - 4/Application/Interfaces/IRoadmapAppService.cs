using Projetos___4.Application.DTO.Roadmap;

namespace Projetos___4.Application.Interfaces
{
    public interface IRoadmapAppService
    {
        Task<RoadmapDTO> Create(RoadmapDTO dto, string userId);
    }
}
