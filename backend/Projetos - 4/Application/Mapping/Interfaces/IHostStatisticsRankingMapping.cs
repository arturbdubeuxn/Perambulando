using Projetos___4.Application.DTO.Programming;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping.Interfaces;

public interface IHostStatisticsRankingMapping
{
    ProgrammingStatisticsDTO ToDTO(ProgrammingStatistics statistics);
}
