namespace Projetos___4.Application.DTO;

public class HostStatisticsDailyDTO
{
    public DateTime Date { get; set; }
    public long DetailViews { get; set; }
    public long CarouselClicks { get; set; }
    public long TicketClicks { get; set; }
    public long NearbyClicks { get; set; }
}
