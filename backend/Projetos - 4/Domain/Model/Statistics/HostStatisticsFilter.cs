using System.ComponentModel.DataAnnotations.Schema;
namespace Projetos___4.Domain.Model.Statistics;

[NotMapped]
public class HostStatisticsFilter
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
