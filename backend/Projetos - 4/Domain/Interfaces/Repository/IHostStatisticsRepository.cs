using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Interfaces.Repository;

public interface IHostStatisticsRepository
{
    Task<HostStatisticsSummary> GetSummaryAsync(int hostId, HostStatisticsFilter filter);
    Task<List<HostStatisticsDaily>> GetDailyAsync(int hostId, HostStatisticsFilter filter);
    Task<List<ProgrammingStatistics>> GetRankingAsync(int hostId, HostStatisticsRankingFilter filter);
}
