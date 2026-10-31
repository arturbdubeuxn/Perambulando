using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping.Interfaces;

public interface IHostStatisticsRankingFilterMapping
{
    HostStatisticsRankingFilter ToModel(HostStatisticsRankingFilterDTO dto);
    HostStatisticsRankingFilterDTO ToDTO(HostStatisticsRankingFilter filter);
}
