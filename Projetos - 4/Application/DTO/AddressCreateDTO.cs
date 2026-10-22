using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO;

public class AddressCreateDTO
{
    [Required, MaxLength(300)]
    public string Street { get; set; } = string.Empty;
    [Required, MaxLength(20)]
    public string Number { get; set; } = string.Empty;
    [MaxLength(200)]
    public string? Complement { get; set; }
    [MaxLength(150)]
    public string? Neighborhood { get; set; }
    [Required, RegularExpression(@"^[0-9]{5}-?[0-9]{3}$", ErrorMessage = "Informe um CEP com oito dígitos.")]
    public string CEP { get; set; } = string.Empty;
}
