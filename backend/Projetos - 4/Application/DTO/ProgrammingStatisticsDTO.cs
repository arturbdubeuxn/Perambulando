namespace Projetos___4.Application.DTO;

public class ProgrammingStatisticsDTO
{
    public long Position { get; set; }
    public int ProgrammingId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public long DetailViews { get; set; }
    public long CarouselClicks { get; set; }
    public long TicketClicks { get; set; }
    public long NearbyClicks { get; set; }
    public long ActiveFavoritesNow { get; set; }
}
