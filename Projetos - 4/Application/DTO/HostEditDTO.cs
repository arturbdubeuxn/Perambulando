using System.ComponentModel.DataAnnotations;
using static Projetos___4.Domain.Model.Hosts;

namespace Projetos___4.Application.DTO;

public class HostEditDTO
{
    [Required, EnumDataType(typeof(TypeofHost))]
    public TypeofHost? Typeofhost { get; set; }

    [MaxLength(18)]
    public string CNPJ { get; set; } = string.Empty;

    [MaxLength(2048)]
    public string LogoUrl { get; set; } = string.Empty;

    [MaxLength(2048)]
    public string InstagranUrl { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string Address { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string AddressNumber { get; set; } = string.Empty;

    [MaxLength(200)]
    public string AddressComplement { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Neighborhood { get; set; } = string.Empty;

    [Required, MaxLength(9)]
    public string CEP { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Phone { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
}
