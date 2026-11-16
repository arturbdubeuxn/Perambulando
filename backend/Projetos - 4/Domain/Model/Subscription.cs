namespace Projetos___4.Domain.Model;

public enum SubscriptionStatus { Inactive = 0, Active = 1, Cancelled = 2, Expired = 3 }

public class Subscription
{
    public int Id { get; set; }
    public User User { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public SubscriptionStatus Status { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }


}
