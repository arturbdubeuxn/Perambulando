namespace Projetos___4.Application.DTO.Roadmap
{
    public class RoadmapDTO
    {

        public string? Name { get; set; }

        public string? Description { get; set; }

        public List<RoadmapProgrammingDTO> roadmapProgrammingDTO { get; set;} = new List<RoadmapProgrammingDTO>();
    }
}
