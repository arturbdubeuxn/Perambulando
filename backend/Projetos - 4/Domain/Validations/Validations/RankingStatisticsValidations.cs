using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;
namespace Projetos___4.Domain.Validations.Validations;

public class RankingStatisticsValidations : IRankingStatisticsValidations
{
    private readonly ISumarryStatitcsValidations _sumarryStatitcsValidations;
    public RankingStatisticsValidations(ISumarryStatitcsValidations sumarryStatitcsValidations)
    {
        _sumarryStatitcsValidations = sumarryStatitcsValidations;
    }

    public async Task<HostStatisticsRankingFilter> Validate(int hostId, string? userId, HostStatisticsRankingFilter filter)
    {
        var period = await _sumarryStatitcsValidations.Validate(hostId, userId, filter);
        if (filter.Take <= 0 || filter.Take > 100)
        {
            throw new ArgumentException("Take deve estar entre 1 e 100.");
        }
        if (filter.Skip < 0)
        {
            throw new ArgumentException("Skip deve ser maior ou igual a zero.");
        }
        var sortBy = filter.SortBy?.Trim().ToLowerInvariant() switch
        {
            "detailviews" => "detailViews",
            "carouselclicks" => "carouselClicks",
            "ticketclicks" => "ticketClicks",
            "nearbyclicks" => "nearbyClicks",
            "activefavoritesnow" => "activeFavoritesNow",
            _ => throw new ArgumentException("SortBy deve ser detailViews, carouselClicks, ticketClicks, nearbyClicks ou activeFavoritesNow.")
        };

        return new HostStatisticsRankingFilter
        {
            StartDate = period.StartDate,
            EndDate = period.EndDate,
            Take = filter.Take,
            Skip = filter.Skip,
            SortBy = sortBy
        };
    }
}
