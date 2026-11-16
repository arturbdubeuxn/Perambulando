using Projetos___4.Application.DTO.Address;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.DTO.Host;

public class HostResponseDTO
{
    public int Id { get; set; }

    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public Hosts.TypeofHost Typeofhost { get; set; }
    public string CNPJ { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string InstagranUrl { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int AddressId { get; set; }
    public AddressDetailsDTO Address { get; set; } = new();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
