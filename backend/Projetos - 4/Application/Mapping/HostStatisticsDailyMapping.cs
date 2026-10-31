using Projetos___4.Application.DTO;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping;

public class HostStatisticsDailyMapping : IHostStatisticsDailyMapping
{
    public HostStatisticsDailyDTO ToDTO(HostStatisticsDaily daily)
    {
        ArgumentNullException.ThrowIfNull(daily);
        return new HostStatisticsDailyDTO
        {
            Date = daily.Date,
            DetailViews = daily.DetailViews,
            CarouselClicks = daily.CarouselClicks,
            TicketClicks = daily.TicketClicks,
            NearbyClicks = daily.NearbyClicks
        };
    }
}
