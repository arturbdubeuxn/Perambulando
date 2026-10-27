using Projetos___4.Domain.Model;
namespace Projetos___4.Application.DTO;
public class SubscriptionResponseDTO
{
    public int? Id { get; set; }
    public SubscriptionStatus Status { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
