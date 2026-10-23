using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO;

public class UserDeleteDTO
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;
}
