using System.ComponentModel.DataAnnotations;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.DTO;

public class UserEditDTO
{
    [Required, MaxLength(256)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, EnumDataType(typeof(User.TypeofUser))]
    public User.TypeofUser? TypeofUser { get; set; }
}
