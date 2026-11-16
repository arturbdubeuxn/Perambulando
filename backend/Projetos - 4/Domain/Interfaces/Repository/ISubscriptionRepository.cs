using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Interfaces.Repository;
public interface ISubscriptionRepository
{
    Task<Subscription?> AddAsync(Subscription subscription);
    Task<Subscription?> GetByUserIdAsync(string userId);
    Task<Subscription?> UpdateAsync(Subscription subscription);
}
