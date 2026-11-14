namespace Projetos___4.Application.DTO.Roadmap
{
    public class RoadmapCreateDTO
    {

        public string Name { get; set; }

        public string? Description { get; set; }

        public List<RoadmapProgrammingCreateDTO> roadmapProgrammingDTO { get; set;} = new List<RoadmapProgrammingCreateDTO>();
    }
}
