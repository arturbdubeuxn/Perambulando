using Projetos___4.Application.DTO;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping;

public class HostStatisticsSummaryMapping : IHostStatisticsSummaryMapping
{
    public HostStatisticsSummaryDTO ToDTO(HostStatisticsSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);
        return new HostStatisticsSummaryDTO
        {
            HostId = summary.HostId,
            StartDate = summary.StartDate,
            EndDate = summary.EndDate,
            DetailViews = summary.DetailViews,
            CarouselClicks = summary.CarouselClicks,
            TicketClicks = summary.TicketClicks,
            NearbyClicks = summary.NearbyClicks,
            ActiveFavoritesNow = summary.ActiveFavoritesNow
        };
    }
}
