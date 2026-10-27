using Projetos___4.Domain.Model;
using Projetos___4.Application.DTO;
namespace Projetos___4.Application.Mapping.Interfaces;
public interface ISubscriptionMapping
{
    Subscription ToModel(string userId);
    SubscriptionResponseDTO ToDTO(Subscription? subscription, SubscriptionStatus status);
}
