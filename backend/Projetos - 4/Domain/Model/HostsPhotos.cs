namespace Projetos___4.Domain.Model
{
    public class HostsPhotos
    {
        public int Id { get; set; }

        public int HostId { get; set; }

        public string PhotoUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreateAt { get; set; }
    }
}
