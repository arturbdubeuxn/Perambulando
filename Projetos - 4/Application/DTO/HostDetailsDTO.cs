using Projetos___4.Domain.Model;

namespace Projetos___4.Application.DTO;

public class HostDetailsDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Hosts.TypeofHost Typeofhost { get; set; }
    public string CNPJ { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string InstagranUrl { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string AddressNumber { get; set; } = string.Empty;
    public string AddressComplement { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string CEP { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public List<ProgrammingDetailsDTO> Programmings { get; set; } = new();
}
