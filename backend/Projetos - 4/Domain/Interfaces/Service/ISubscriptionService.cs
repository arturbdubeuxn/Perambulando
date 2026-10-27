using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Interfaces.Service;
public interface ISubscriptionService
{
    Task<Subscription?> GetAsync(string userId);
    Task<Subscription?> ActivateAsync(Subscription subscription);
    Task<Subscription?> CancelAsync(string userId);
}
