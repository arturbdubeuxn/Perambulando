namespace Projetos___4.Application.DTO;

public class ProgrammingDetailsDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsFree { get; set; }
    public string Address { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string CEP { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string TicketUrl { get; set; } = string.Empty;
    public string InstagranUrl { get; set; } = string.Empty;
    public int HostId { get; set; }
    public string HostName { get; set; } = string.Empty;
    public string HostLogoUrl { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public DateTime UpdateDate { get; set; }
    public float MinPrice { get; set; }
    public float MaxPrice { get; set; }
}
