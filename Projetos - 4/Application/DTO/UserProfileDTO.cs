using Projetos___4.Domain.Model;

namespace Projetos___4.Application.DTO;

public class UserProfileDTO
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public User.TypeofUser TypeofUser { get; set; }

    public bool IsPro { get; set; }

    public DateTime CreatedAt { get; set; }
}
