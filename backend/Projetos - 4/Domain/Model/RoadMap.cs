namespace Projetos___4.Domain.Model
{
    public class RoadMap
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public User User { get; set; }
        public string UserId { get; set; }
     
    }
}
