using Microsoft.EntityFrameworkCore;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Repository
{
    public class SubscriptionRepository : ISubscriptionRepository
    {
        private readonly Context.Context Db;

        public SubscriptionRepository(Context.Context context)
        {
            Db = context;
        }

        public async Task<Subscription?> AddAsync(Subscription subscription)
        {
            Db.Subscriptions.Add(subscription);

            await Db.SaveChangesAsync();

            return subscription;
        }

        public async Task<Subscription?> GetByUserIdAsync(string userId)
        {
            return await Db.Subscriptions.FirstOrDefaultAsync(s => s.UserId == userId);
        }

        public async Task<Subscription?> UpdateAsync(Subscription subscription)
        {
            if (subscription != null)
            {
                await Db.SaveChangesAsync();
            }

            return subscription;
        }
    }
}
