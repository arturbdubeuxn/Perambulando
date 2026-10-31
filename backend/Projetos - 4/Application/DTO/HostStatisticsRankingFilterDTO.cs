namespace Projetos___4.Application.DTO;

public class HostStatisticsRankingFilterDTO
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Take { get; set; } = 10;
    public int Skip { get; set; }
    public string SortBy { get; set; } = "detailViews";
}
