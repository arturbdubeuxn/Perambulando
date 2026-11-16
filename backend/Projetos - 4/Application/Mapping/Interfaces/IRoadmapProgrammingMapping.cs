using Projetos___4.Application.DTO.Roadmap;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping.Interfaces
{
    public interface IRoadmapProgrammingMapping
    {
        RoadmapProgramming ToModel(RoadmapProgrammingCreateDTO roadmapProgrammingDTO);

        RoadmapProgrammingResponseDTO ToDTO(RoadmapProgramming roadmapProgramming);
    }
}
