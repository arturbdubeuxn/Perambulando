using System.ComponentModel.DataAnnotations.Schema;
namespace Projetos___4.Domain.Model;

[NotMapped]
public class HostStatisticsRankingFilter : HostStatisticsFilter
{
    public int Take { get; set; } = 10;
    public int Skip { get; set; }
    public string SortBy { get; set; } = "detailViews";
}
