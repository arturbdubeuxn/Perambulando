using Projetos___4.Domain.Model;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Mapping.Interfaces;
namespace Projetos___4.Application.Mapping;
public class SubscriptionMapping : ISubscriptionMapping
{
    public Subscription ToModel(string userId)
    {
        return new Subscription
        {
            UserId = userId
            
        };
    }

    public SubscriptionResponseDTO ToDTO(Subscription? subscription)
    {
        var now = DateTime.UtcNow;
        var effective = subscription?.IsEffective(now) == true;
        return new SubscriptionResponseDTO
        {
            Id = subscription?.Id,
            Status = subscription == null ? SubscriptionStatus.Inactive :
                subscription.Status == SubscriptionStatus.Active && now >= subscription.ExpiresAt ? SubscriptionStatus.Expired : subscription.Status,
            StartsAt = subscription?.StartsAt,
            ExpiresAt = subscription?.ExpiresAt,
            CanFeatureProgrammings = effective,
            CanViewStatistics = effective
        };
    }
}
