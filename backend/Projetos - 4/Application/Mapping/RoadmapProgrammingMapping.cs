using Projetos___4.Application.DTO.Roadmap;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping
{
    public class RoadmapProgrammingMapping : IRoadmapProgrammingMapping
    {
        readonly IProgrammingMapping _programmingMapping;
        readonly IHostMapping _hostMapping;
   

        public RoadmapProgrammingMapping(IProgrammingMapping programmingMapping, IHostMapping hostMapping)
        {
            _programmingMapping = programmingMapping;
            _hostMapping = hostMapping;
    
        }
    
        public RoadmapProgramming ToModel(RoadmapProgrammingCreateDTO roadmapProgrammingDTO)
        {
            return new RoadmapProgramming
            {
                RoadmapId = roadmapProgrammingDTO.RoadmapId,
                Order = roadmapProgrammingDTO.Order,
                StartDate = roadmapProgrammingDTO.StartDate,
                EndDate = roadmapProgrammingDTO.EndDate,
                HostId = roadmapProgrammingDTO.HostId,
                ProgrammingId = roadmapProgrammingDTO.ProgrammingId,

            };
     
        }
        

        public RoadmapProgrammingResponseDTO ToDTO(RoadmapProgramming roadmapProgramming)
        {

            return new RoadmapProgrammingResponseDTO
            {
                Id = roadmapProgramming.Id,
                RoadmapId = roadmapProgramming.RoadmapId,
                Order = roadmapProgramming.Order,
                StartDate = roadmapProgramming.StartDate,
                EndDate = roadmapProgramming.EndDate,
                Programming = roadmapProgramming.Programming != null ? _programmingMapping.ToDTO(roadmapProgramming.Programming) : null,
                HostId = roadmapProgramming.HostId,
                ProgrammingId = roadmapProgramming.ProgrammingId,
                hostDTO = roadmapProgramming.Host != null ? _hostMapping.ToDTO(roadmapProgramming.Host) : null
            };
        }
    }
}
