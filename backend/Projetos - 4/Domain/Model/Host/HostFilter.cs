namespace Projetos___4.Domain.Model.Host;

public class HostFilter
{
    public string? Name { get; set; }
    public List<Hosts.TypeofHost>? Types { get; set; }
    public string? City { get; set; }
    public bool? HasProgrammings { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public DayOfWeek? DayOfWeek { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public bool EndsNextDay { get; set; }
    public int Take { get; set; } = 10;
    public int Skip { get; set; } = 0;
}
