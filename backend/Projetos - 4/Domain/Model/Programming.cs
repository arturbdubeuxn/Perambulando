namespace Projetos___4.Domain.Model
{
    public class Programming
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsFree { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string TicketUrl { get; set; } = string.Empty;
        public string InstagranUrl { get; set; } = string.Empty;
        public Hosts Host { get; set; }
        public int HostId { get; set; }
        public Address Address { get; set; } = null!;
        public int AddressId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdateDate { get; set; } = DateTime.UtcNow;
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public ICollection<ProgrammingXCategory> ProgrammingXCategories { get; set; } = new List<ProgrammingXCategory>();
    }
}
