using Projetos___4.Domain.Model.Statistics;
namespace Projetos___4.Application.DTO.Statistics;
public class SubscriptionResponseDTO
{
    public int? Id { get; set; }
    public SubscriptionStatus Status { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
