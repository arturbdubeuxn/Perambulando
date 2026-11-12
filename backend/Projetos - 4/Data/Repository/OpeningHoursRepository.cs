using Microsoft.EntityFrameworkCore;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model.OpeningDay;

namespace Projetos___4.Data.Repository;

public class OpeningHoursRepository : IOpeningHoursRepository
{
    private readonly Context.Context Db;

    public OpeningHoursRepository(Context.Context db)
    {
        Db = db;
    }

    public Task<List<HostOpeningDay>> GetByHostIdAsync(int hostId)
    {
        return Db.HostOpeningDays
            .AsNoTracking()
            .Include(day => day.Periods.OrderBy(period => period.OpeningTime).ThenBy(period => period.Id))
            .Where(day => day.HostId == hostId)
            .OrderBy(day => day.DayOfWeek)
            .ToListAsync();
    }

    public async Task<List<HostOpeningDay>> EditAsync(List<HostOpeningDay> days, int hostId)
    {
        ArgumentNullException.ThrowIfNull(days);

        await using var transaction = await Db.Database.BeginTransactionAsync();
        try
        {
            var host = await Db.Hosts
                .FromSqlInterpolated($"SELECT * FROM \"Hosts\" WHERE \"Id\" = {hostId} AND \"IsActive\" FOR UPDATE")
                .AsNoTracking()
                .FirstOrDefaultAsync();
            if (host == null)
            {
                throw new KeyNotFoundException("Host não encontrado ou indisponível.");
            }

            var currentDays = await Db.HostOpeningDays
                .Include(day => day.Periods)
                .Where(day => day.HostId == hostId)
                .ToListAsync();

            Db.HostOpeningDays.RemoveRange(currentDays);
            await Db.SaveChangesAsync();

            Db.HostOpeningDays.AddRange(days);
            await Db.SaveChangesAsync();

            var updated = await GetByHostIdAsync(hostId);
            await transaction.CommitAsync();
            return updated;
        }
        catch
        {
            await transaction.RollbackAsync();
            Db.ChangeTracker.Clear();
            throw;
        }
    }
}
