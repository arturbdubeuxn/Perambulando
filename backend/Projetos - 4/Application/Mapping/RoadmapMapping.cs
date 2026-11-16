using Projetos___4.Application.DTO.Roadmap;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping
{
    public class RoadmapMapping : IRoadmapMapping
    {
        private readonly IRoadmapProgrammingMapping _roadmapProgrammingMapping;

        public RoadmapMapping(IRoadmapProgrammingMapping roadmapProgrammingMapping)
        {
            _roadmapProgrammingMapping = roadmapProgrammingMapping;
        }

        public RoadmapResponseDTO ToDTO(Roadmap roadmap)
        {
            ArgumentNullException.ThrowIfNull(roadmap);
            return new RoadmapResponseDTO
            {
                Id = roadmap.Id,
                Name = roadmap.Name,
                Description = roadmap.Description,
                roadmapProgrammingResponseDTO = roadmap.roadmapProgrammings
                    .OrderBy(programming => programming.Order)
                    .Select(programming => _roadmapProgrammingMapping.ToDTO(programming))
                    .ToList()
            };
        }

        public Roadmap ToModel(RoadmapCreateDTO dto, string? userId)
        {
            ArgumentNullException.ThrowIfNull(dto);
            var roadmap = new Roadmap
            {
                Name = dto.Name,
                Description = dto.Description,
                UserId = userId
            };

            foreach (var programmingDTO in dto.roadmapProgrammingDTO)
            {
                var programming = _roadmapProgrammingMapping.ToModel(programmingDTO);
                programming.Roadmap = roadmap;
                programming.RoadmapId = roadmap.Id;
                roadmap.roadmapProgrammings.Add(programming);
            }

            return roadmap;
        }
    }
}
