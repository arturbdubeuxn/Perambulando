using Projetos___4.Application.DTO.Statistics;
using Projetos___4.Domain.Model.Statistics;
namespace Projetos___4.Application.Mapping.Interfaces;

public interface IHostStatisticsDailyMapping
{
    HostStatisticsDailyDTO ToDTO(HostStatisticsDaily daily);
}
