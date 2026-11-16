using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;
namespace Projetos___4.Domain.Service;

public class HostStatisticsService : IHostStatisticsService
{
    private readonly IHostStatisticsRepository _hostStatisticsRepository;
    private readonly ISumarryStatitcsValidations _sumarryStatitcsValidations;
    private readonly IRankingStatisticsValidations _rankingStatisticsValidations;

    public HostStatisticsService(IHostStatisticsRepository hostStatisticsRepository,
        ISumarryStatitcsValidations sumarryStatitcsValidations, IRankingStatisticsValidations rankingStatisticsValidations)
    {
        _hostStatisticsRepository = hostStatisticsRepository;
        _sumarryStatitcsValidations = sumarryStatitcsValidations;
        _rankingStatisticsValidations = rankingStatisticsValidations;
    }

    public async Task<List<ProgrammingStatistics>> GetRankingAsync(int hostId, string? userId, HostStatisticsRankingFilter filter)
    {
        var validated = await _rankingStatisticsValidations.Validate(hostId, userId, filter);
        var programmings = await _hostStatisticsRepository.GetRankingAsync(hostId, validated);
        for (var index = 0; index < programmings.Count; index++)
        {
            programmings[index].Position = (long)validated.Skip + index + 1;
        }
        return programmings;
    }

    public async Task<HostStatisticsSummary> GetSummaryAsync(int hostId, string? userId, HostStatisticsFilter filter)
    {
        var period = await _sumarryStatitcsValidations.Validate(hostId, userId, filter);
        return await _hostStatisticsRepository.GetSummaryAsync(hostId, period);
    }

    public async Task<List<HostStatisticsDaily>> GetDailyAsync(int hostId, string? userId, HostStatisticsFilter filter)
    {
        var period = await _sumarryStatitcsValidations.Validate(hostId, userId, filter);
        var records = await _hostStatisticsRepository.GetDailyAsync(hostId, period);
        var byDate = records.ToDictionary(item => item.Date);
        var firstDay = period.StartDate!.Value.Date;
        var end = period.EndDate!.Value;
        var dayCount = (end.Date - firstDay).Days + (end.TimeOfDay > TimeSpan.Zero ? 1 : 0);
        var days = new List<HostStatisticsDaily>();

        for (var index = 0; index < dayCount; index++)
        {
            var date = firstDay.AddDays(index);
            if (!byDate.TryGetValue(date, out var daily))
            {
                daily = new HostStatisticsDaily { Date = date };
            }
            days.Add(daily);
        }

        return days;
    }
}
