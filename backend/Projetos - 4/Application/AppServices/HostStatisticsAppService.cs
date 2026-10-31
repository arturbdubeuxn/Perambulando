using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
namespace Projetos___4.Application.AppServices;

public class HostStatisticsAppService : IHostStatisticsAppService
{
    private readonly IHostStatisticsService _hostStatisticsService;
    private readonly IHostStatisticsFilterMapping _hostStatisticsFilterMapping;
    private readonly IHostStatisticsSummaryMapping _hostStatisticsSummaryMapping;
    private readonly IHostStatisticsDailyMapping _hostStatisticsDailyMapping;
    private readonly IHostStatisticsRankingFilterMapping _hostStatisticsRankingFilterMapping;
    private readonly IHostStatisticsRankingMapping _hostStatisticsRankingMapping;
    public HostStatisticsAppService(IHostStatisticsService hostStatisticsService,
        IHostStatisticsFilterMapping hostStatisticsFilterMapping, IHostStatisticsSummaryMapping hostStatisticsSummaryMapping,
        IHostStatisticsDailyMapping hostStatisticsDailyMapping,
        IHostStatisticsRankingFilterMapping hostStatisticsRankingFilterMapping, IHostStatisticsRankingMapping hostStatisticsRankingMapping)
    {
        _hostStatisticsService = hostStatisticsService;
        _hostStatisticsFilterMapping = hostStatisticsFilterMapping;
        _hostStatisticsSummaryMapping = hostStatisticsSummaryMapping;
        _hostStatisticsDailyMapping = hostStatisticsDailyMapping;
        _hostStatisticsRankingFilterMapping = hostStatisticsRankingFilterMapping;
        _hostStatisticsRankingMapping = hostStatisticsRankingMapping;
    }

    public async Task<List<ProgrammingStatisticsDTO>> GetRankingAsync(int hostId, string? userId, HostStatisticsRankingFilterDTO dto)
    {
        var filter = _hostStatisticsRankingFilterMapping.ToModel(dto);
        var programmings = await _hostStatisticsService.GetRankingAsync(hostId, userId, filter);
        return programmings.Select(_hostStatisticsRankingMapping.ToDTO).ToList();
    }

    public async Task<HostStatisticsSummaryDTO> GetSummaryAsync(int hostId, string? userId, HostStatisticsFilterDTO dto)
    {
        var filter = _hostStatisticsFilterMapping.ToModel(dto);
        var summary = await _hostStatisticsService.GetSummaryAsync(hostId, userId, filter);
        return _hostStatisticsSummaryMapping.ToDTO(summary);
    }

    public async Task<List<HostStatisticsDailyDTO>> GetDailyAsync(int hostId, string? userId, HostStatisticsFilterDTO dto)
    {
        var filter = _hostStatisticsFilterMapping.ToModel(dto);
        var days = await _hostStatisticsService.GetDailyAsync(hostId, userId, filter);
        return days.Select(_hostStatisticsDailyMapping.ToDTO).ToList();
    }
}
