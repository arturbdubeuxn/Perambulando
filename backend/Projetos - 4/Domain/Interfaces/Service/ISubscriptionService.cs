using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Interfaces.Service;
public interface ISubscriptionService
{
    SubscriptionStatus GetStatus(Subscription? subscription);
    Task<bool> IsProAsync(string userId);
    Task<Subscription?> GetAsync(string userId);
    Task<Subscription?> ActivateAsync(Subscription subscription);
    Task<Subscription?> CancelAsync(string userId);
}
