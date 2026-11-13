using Projetos___4.Application.DTO.Statistics;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping.Interfaces;

public interface IHostStatisticsFilterMapping
{
    HostStatisticsFilter ToModel(HostStatisticsFilterDTO dto);
    HostStatisticsFilterDTO ToDTO(HostStatisticsFilter filter);
}
