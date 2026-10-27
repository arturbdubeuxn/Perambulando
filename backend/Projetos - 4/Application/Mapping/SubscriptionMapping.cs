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

    public SubscriptionResponseDTO ToDTO(Subscription? subscription, SubscriptionStatus status)
    {
        return new SubscriptionResponseDTO
        {
            Id = subscription?.Id,
            Status = status,
            StartsAt = subscription?.StartsAt,
            ExpiresAt = subscription?.ExpiresAt
        };
    }
}
