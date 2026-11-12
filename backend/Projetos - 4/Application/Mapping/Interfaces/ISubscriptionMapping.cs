using Projetos___4.Application.DTO.Statistics;
using Projetos___4.Domain.Model.Statistics;
namespace Projetos___4.Application.Mapping.Interfaces;
public interface ISubscriptionMapping
{
    Subscription ToModel(string userId);
    SubscriptionResponseDTO ToDTO(Subscription? subscription, SubscriptionStatus status);
}
