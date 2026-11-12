using Projetos___4.Application.DTO.Programming;
using Projetos___4.Application.DTO.Statistics;
namespace Projetos___4.Application.Interfaces;

public interface IHostStatisticsAppService
{
    Task<HostStatisticsSummaryDTO> GetSummaryAsync(int hostId, string? userId, HostStatisticsFilterDTO dto);
    Task<List<HostStatisticsDailyDTO>> GetDailyAsync(int hostId, string? userId, HostStatisticsFilterDTO dto);
    Task<List<ProgrammingStatisticsDTO>> GetRankingAsync(int hostId, string? userId, HostStatisticsRankingFilterDTO dto);
}
