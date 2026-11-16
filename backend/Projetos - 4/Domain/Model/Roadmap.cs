using Projetos___4.Application.DTO.Roadmap;

namespace Projetos___4.Domain.Model
{
    public class Roadmap
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public string? Description { get; set; }

        public User? User { get; set; }

        public string? UserId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;
        public List<RoadmapProgramming> roadmapProgrammings { get; set; } = new List<RoadmapProgramming>();
    }
}
