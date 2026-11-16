using Projetos___4.Application.DTO.Roadmap;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping.Interfaces
{
    public interface IRoadmapMapping
    {
        RoadmapResponseDTO ToDTO(Roadmap roadmap);

        Roadmap ToModel(RoadmapCreateDTO roadmapCreateDTO, string? userId);

    }
}

