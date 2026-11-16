namespace Projetos___4.Application.DTO.Roadmap
{
    public class RoadmapResponseDTO
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string? Description { get; set; }

        public List<RoadmapProgrammingResponseDTO> roadmapProgrammingResponseDTO { get; set; } = new List<RoadmapProgrammingResponseDTO>();


    }
}
