using Projetos___4.Domain.Model;
using DomainUser = Projetos___4.Domain.Model.User;

namespace Projetos___4.Application.DTO.User;

public class UserProfileDTO
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public DomainUser.TypeofUser TypeofUser { get; set; }

    public bool IsPro { get; set; }

    public DateTime CreatedAt { get; set; }
}
