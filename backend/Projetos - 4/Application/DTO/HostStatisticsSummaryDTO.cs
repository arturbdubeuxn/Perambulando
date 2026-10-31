namespace Projetos___4.Application.DTO;

public class HostStatisticsSummaryDTO
{
    public int HostId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public long DetailViews { get; set; }
    public long CarouselClicks { get; set; }
    public long TicketClicks { get; set; }
    public long NearbyClicks { get; set; }
    public long ActiveFavoritesNow { get; set; }
}
