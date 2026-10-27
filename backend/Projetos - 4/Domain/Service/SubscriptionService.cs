using Projetos___4.Domain.Model;
using Projetos___4.Domain.Interfaces;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
namespace Projetos___4.Domain.Service;
public class SubscriptionService : ISubscriptionService
{
    private readonly ISubscriptionRepository _subscriptionRepository;
    private readonly IUserService _userService;
    public SubscriptionService(ISubscriptionRepository subscriptionRepository, IUserService userService, IConfiguration configuration)

    { _subscriptionRepository = subscriptionRepository; _userService = userService;}

    public SubscriptionStatus GetStatus(Subscription? subscription)
    {
        if (subscription == null)
        {
            return SubscriptionStatus.Inactive;
        }

        var now = DateTime.UtcNow;
        if (subscription.Status == SubscriptionStatus.Active)
        {
            if (now >= subscription.ExpiresAt)
            {
                return SubscriptionStatus.Expired;
            }
            if (now < subscription.StartsAt)
            {
                return SubscriptionStatus.Inactive;
            }
        }

        return subscription.Status;
    }

    public async Task<bool> IsProAsync(string userId)
    {
        var subscription = await GetAsync(userId);
        return GetStatus(subscription) == SubscriptionStatus.Active;
    }

    public async Task<Subscription?> GetAsync(string userId)
    {
        var user = await _userService.GetProfileAsync(userId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Usuário não encontrado.");
        }
        var subscription = await _subscriptionRepository.GetByUserIdAsync(userId);
        var status = GetStatus(subscription);
        if (subscription != null && subscription.Status == SubscriptionStatus.Active && status == SubscriptionStatus.Expired)
        {
            subscription.Status = SubscriptionStatus.Expired;
            return await _subscriptionRepository.UpdateAsync(subscription);
        }

        return subscription;
    }

    public async Task<Subscription?> ActivateAsync(Subscription subscription)
    {
        ArgumentNullException.ThrowIfNull(subscription);
        var user = await _userService.GetProfileAsync(subscription.UserId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Usuário não encontrado.");
        }

        var current = await _subscriptionRepository.GetByUserIdAsync(subscription.UserId);
        var now = DateTime.UtcNow;
        if (current != null && current.Status == SubscriptionStatus.Active)
        {
            return current;
        }

        if (current != null)
        {
            subscription = current;
        }

        subscription.Status = SubscriptionStatus.Active;
        subscription.StartsAt = now;
        subscription.ExpiresAt = now.AddMonths(1);
        subscription.CancelledAt = null;
        subscription.CreatedAt = current?.CreatedAt ?? now;
        subscription.UpdatedAt = now;

        if (current != null)
        {
            return await _subscriptionRepository.UpdateAsync(subscription);
        }

        return await _subscriptionRepository.AddAsync(subscription);
    }

    public async Task<Subscription?> CancelAsync(string userId)
    {
        var user = await _userService.GetProfileAsync(userId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Usuário não encontrado.");
        }

        var subscription = await _subscriptionRepository.GetByUserIdAsync(userId);
        if (subscription == null || subscription.Status == SubscriptionStatus.Cancelled)
        {
            return subscription;
        }

        subscription.Status = SubscriptionStatus.Cancelled;
        subscription.CancelledAt = DateTime.UtcNow;
        subscription.UpdatedAt = subscription.CancelledAt.Value;

        return await _subscriptionRepository.UpdateAsync(subscription);
    }
}
