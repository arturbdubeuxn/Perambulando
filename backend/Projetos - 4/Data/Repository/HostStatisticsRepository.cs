using Microsoft.EntityFrameworkCore;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;
namespace Projetos___4.Data.Repository;

public class HostStatisticsRepository : IHostStatisticsRepository
{
    private readonly Context.Context Db;
    public HostStatisticsRepository(Context.Context db)
    {
        Db = db;
    }

    public async Task<List<ProgrammingStatistics>> GetRankingAsync(int hostId, HostStatisticsRankingFilter filter)
    {
        var interactions =
            from interaction in Db.ProgrammingInteractions.AsNoTracking()
            join programming in Db.Programmings on interaction.ProgrammingId equals programming.Id
            where programming.HostId == hostId &&
                interaction.CreatedAt >= filter.StartDate!.Value && interaction.CreatedAt < filter.EndDate!.Value
            group interaction by interaction.ProgrammingId into grouped
            select new
            {
                ProgrammingId = grouped.Key,
                DetailViews = grouped.LongCount(item => item.Type == ProgrammingInteractionType.DetailView),
                CarouselClicks = grouped.LongCount(item => item.Type == ProgrammingInteractionType.CarouselClick),
                TicketClicks = grouped.LongCount(item => item.Type == ProgrammingInteractionType.TicketClick),
                NearbyClicks = grouped.LongCount(item => item.Type == ProgrammingInteractionType.NearbyClick)
            };

        var favorites =
            from favorite in Db.Favorites.AsNoTracking()
            join programming in Db.Programmings on favorite.ProgrammingId equals programming.Id
            where programming.HostId == hostId && favorite.IsActive && favorite.User.IsActive
            group favorite by favorite.ProgrammingId into grouped
            select new { ProgrammingId = grouped.Key, Count = grouped.LongCount() };

        var query =
            from programming in Db.Programmings.AsNoTracking()
            join interaction in interactions on programming.Id equals interaction.ProgrammingId into programmingInteractions
            from interaction in programmingInteractions.DefaultIfEmpty()
            join favorite in favorites on programming.Id equals favorite.ProgrammingId into programmingFavorites
            from favorite in programmingFavorites.DefaultIfEmpty()
            where programming.HostId == hostId
            select new ProgrammingStatistics
            {
                ProgrammingId = programming.Id,
                Name = programming.Name,
                IsActive = programming.IsActive,
                DetailViews = (long?)interaction.DetailViews ?? 0,
                CarouselClicks = (long?)interaction.CarouselClicks ?? 0,
                TicketClicks = (long?)interaction.TicketClicks ?? 0,
                NearbyClicks = (long?)interaction.NearbyClicks ?? 0,
                ActiveFavoritesNow = (long?)favorite.Count ?? 0
            };

        var ordered = filter.SortBy switch
        {
            "carouselClicks" => query.OrderByDescending(item => item.CarouselClicks),
            "ticketClicks" => query.OrderByDescending(item => item.TicketClicks),
            "nearbyClicks" => query.OrderByDescending(item => item.NearbyClicks),
            "activeFavoritesNow" => query.OrderByDescending(item => item.ActiveFavoritesNow),
            _ => query.OrderByDescending(item => item.DetailViews)
        };

        return await ordered.ThenBy(item => item.ProgrammingId).Skip(filter.Skip).Take(filter.Take).ToListAsync();
    }

    public async Task<List<HostStatisticsDaily>> GetDailyAsync(int hostId, HostStatisticsFilter filter)
    {
        var query =
            from interaction in Db.ProgrammingInteractions.AsNoTracking()
            join programming in Db.Programmings on interaction.ProgrammingId equals programming.Id
            where programming.HostId == hostId &&
                interaction.CreatedAt >= filter.StartDate!.Value && interaction.CreatedAt < filter.EndDate!.Value
            group interaction by interaction.CreatedAt.Date into grouped
            orderby grouped.Key
            select new HostStatisticsDaily
            {
                Date = grouped.Key,
                DetailViews = grouped.LongCount(item => item.Type == ProgrammingInteractionType.DetailView),
                CarouselClicks = grouped.LongCount(item => item.Type == ProgrammingInteractionType.CarouselClick),
                TicketClicks = grouped.LongCount(item => item.Type == ProgrammingInteractionType.TicketClick),
                NearbyClicks = grouped.LongCount(item => item.Type == ProgrammingInteractionType.NearbyClick)
            };

        return await query.ToListAsync();
    }

    public async Task<HostStatisticsSummary> GetSummaryAsync(int hostId, HostStatisticsFilter filter)
    {
        var interactions =
            from interaction in Db.ProgrammingInteractions.AsNoTracking()
            join programming in Db.Programmings on interaction.ProgrammingId equals programming.Id
            where programming.HostId == hostId &&
                interaction.CreatedAt >= filter.StartDate!.Value && interaction.CreatedAt < filter.EndDate!.Value
            group interaction by interaction.Type into grouped
            select new { Type = grouped.Key, Count = grouped.LongCount() };

        var counts = await interactions.ToListAsync();
        var favorites =
            from favorite in Db.Favorites.AsNoTracking()
            join programming in Db.Programmings on favorite.ProgrammingId equals programming.Id
            where programming.HostId == hostId && favorite.IsActive && favorite.User.IsActive
            select favorite;

        return new HostStatisticsSummary
        {
            HostId = hostId,
            StartDate = filter.StartDate!.Value,
            EndDate = filter.EndDate!.Value,
            DetailViews = counts.Where(item => item.Type == ProgrammingInteractionType.DetailView).Sum(item => item.Count),
            CarouselClicks = counts.Where(item => item.Type == ProgrammingInteractionType.CarouselClick).Sum(item => item.Count),
            TicketClicks = counts.Where(item => item.Type == ProgrammingInteractionType.TicketClick).Sum(item => item.Count),
            NearbyClicks = counts.Where(item => item.Type == ProgrammingInteractionType.NearbyClick).Sum(item => item.Count),
            ActiveFavoritesNow = await favorites.LongCountAsync()
        };
    }
}
