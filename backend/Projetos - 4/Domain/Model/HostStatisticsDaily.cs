using System.ComponentModel.DataAnnotations.Schema;
namespace Projetos___4.Domain.Model;

[NotMapped]
public class HostStatisticsDaily
{
    public DateTime Date { get; set; }
    public long DetailViews { get; set; }
    public long CarouselClicks { get; set; }
    public long TicketClicks { get; set; }
    public long NearbyClicks { get; set; }
}
