using System.ComponentModel.DataAnnotations;
using Projetos___4.Domain.Model;
using DomainUser = Projetos___4.Domain.Model.User;

namespace Projetos___4.Application.DTO.User;

public class UserDTO
{
    [Required, MaxLength(256)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    public string? Password { get; set; }

    [Required, EnumDataType(typeof(DomainUser.TypeofUser))]
    public DomainUser.TypeofUser? TypeOfUser { get; set; }
}
