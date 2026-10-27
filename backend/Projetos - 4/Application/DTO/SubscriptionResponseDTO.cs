using Projetos___4.Domain.Model;
namespace Projetos___4.Application.DTO;
public class SubscriptionResponseDTO
{
    public int? Id { get; set; }
    public SubscriptionStatus Status { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsSimulation { get; set; } = true;
    public bool CanFeatureProgrammings { get; set; }
    public bool CanViewStatistics { get; set; }
}
