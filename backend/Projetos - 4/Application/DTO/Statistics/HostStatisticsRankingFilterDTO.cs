using System.ComponentModel.DataAnnotations;
namespace Projetos___4.Application.DTO.Statistics;

public class HostStatisticsRankingFilterDTO
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    [Range(1, 100)]
    public int Take { get; set; } = 10;
    [Range(0, int.MaxValue)]
    public int Skip { get; set; }
    public string SortBy { get; set; } = "detailViews";
}
