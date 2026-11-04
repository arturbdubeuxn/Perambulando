namespace Projetos___4.Domain.Model;

public class HostOpeningPeriod
{
    public int Id { get; set; }
    public HostOpeningDay HostOpeningDay { get; set; } = null!;
    public int HostOpeningDayId { get; set; }
    public TimeOnly OpeningTime { get; set; }
    public TimeOnly ClosingTime { get; set; }
    public bool ClosesNextDay { get; set; }
}
