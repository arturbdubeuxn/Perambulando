using Projetos___4.Application.DTO;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping;

public class HostStatisticsRankingMapping : IHostStatisticsRankingMapping
{
    public ProgrammingStatisticsDTO ToDTO(ProgrammingStatistics statistics)
    {
        ArgumentNullException.ThrowIfNull(statistics);
        return new ProgrammingStatisticsDTO
        {
            Position = statistics.Position,
            ProgrammingId = statistics.ProgrammingId,
            Name = statistics.Name,
            IsActive = statistics.IsActive,
            DetailViews = statistics.DetailViews,
            CarouselClicks = statistics.CarouselClicks,
            TicketClicks = statistics.TicketClicks,
            NearbyClicks = statistics.NearbyClicks,
            ActiveFavoritesNow = statistics.ActiveFavoritesNow
        };
    }
}
