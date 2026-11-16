namespace Projetos___4.Domain.Model;

public class HostOpeningDay
{
    public int Id { get; set; }
    public Hosts Host { get; set; } = null!;
    public int HostId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public bool IsClosed { get; set; }
    public ICollection<HostOpeningPeriod> Periods { get; set; } = new List<HostOpeningPeriod>();
}
