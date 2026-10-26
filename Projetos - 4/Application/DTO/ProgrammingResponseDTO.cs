namespace Projetos___4.Application.DTO;

public class ProgrammingResponseDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsFree { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string TicketUrl { get; set; } = string.Empty;
    public string InstagranUrl { get; set; } = string.Empty;
    public int HostId { get; set; }
    public int AddressId { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime UpdateDate { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public AddressDetailsDTO Address { get; set; } = new();
}
