
namespace Projetos___4.Application.DTO;

public class ProgrammingDetailsDTO
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsFree { get; set; }
    public int AddressId { get; set; }
    public AddressDetailsDTO Address { get; set; } = new();
    public int Id { get; set; }
    public int HostId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;
    public string TicketUrl { get; set; } = string.Empty;
    public string InstagranUrl { get; set; } = string.Empty;
    public string HostName { get; set; } = string.Empty;
    public string HostLogoUrl { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public DateTime UpdateDate { get; set; }
    public float MinPrice { get; set; }
    public float MaxPrice { get; set; }

    public List<CategoryResponseDTO>? Categories { get; set; }
}
