using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Interfaces.Service;

public interface IHostStatisticsService
{
    Task<HostStatisticsSummary> GetSummaryAsync(int hostId, string? userId, HostStatisticsFilter filter);
    Task<List<HostStatisticsDaily>> GetDailyAsync(int hostId, string? userId, HostStatisticsFilter filter);
    Task<List<ProgrammingStatistics>> GetRankingAsync(int hostId, string? userId, HostStatisticsRankingFilter filter);
}
