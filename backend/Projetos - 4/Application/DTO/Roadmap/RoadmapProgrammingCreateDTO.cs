using Projetos___4.Application.DTO.Host;
using Projetos___4.Application.DTO.Programming;

namespace Projetos___4.Application.DTO.Roadmap
{
    public class RoadmapProgrammingCreateDTO
    {
        public int RoadmapId { get; set; }

        public ProgrammingDTO? Programming { get; set; }
        public int? ProgrammingId { get; set; }

        public HostDTO? hostDTO { get; set; }

        public int? HostId { get; set; }

        public int Order { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }


    }
}
