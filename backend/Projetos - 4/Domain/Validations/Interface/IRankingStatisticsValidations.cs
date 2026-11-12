using Projetos___4.Domain.Model.Statistics;
namespace Projetos___4.Domain.Validations.Interface;

public interface IRankingStatisticsValidations
{
    Task<HostStatisticsRankingFilter> Validate(int hostId, string? userId, HostStatisticsRankingFilter filter);
}
