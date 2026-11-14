namespace Projetos___4.Domain.Model
{
    public class RoadmapProgramming
    {
        public int Id { get; set; }
        public Roadmap Roadmap { get; set; }
        public int RoadmapId { get; set; }
        public Programming? Programming { get; set; }
        public int? ProgrammingId { get; set; }
        public Hosts? Host { get; set; }
        public int? HostId { get; set; }
        public int Order { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

    }
}