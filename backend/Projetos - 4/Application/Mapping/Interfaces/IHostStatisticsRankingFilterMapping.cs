using Projetos___4.Application.DTO.Statistics;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping.Interfaces;

public interface IHostStatisticsRankingFilterMapping
{
    HostStatisticsRankingFilter ToModel(HostStatisticsRankingFilterDTO dto);
    HostStatisticsRankingFilterDTO ToDTO(HostStatisticsRankingFilter filter);
}
