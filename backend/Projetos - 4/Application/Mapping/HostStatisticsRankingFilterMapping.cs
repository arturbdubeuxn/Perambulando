using Projetos___4.Application.DTO;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping;

public class HostStatisticsRankingFilterMapping : IHostStatisticsRankingFilterMapping
{
    public HostStatisticsRankingFilter ToModel(HostStatisticsRankingFilterDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new HostStatisticsRankingFilter
        {
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Take = dto.Take,
            Skip = dto.Skip,
            SortBy = dto.SortBy
        };
    }

    public HostStatisticsRankingFilterDTO ToDTO(HostStatisticsRankingFilter filter)
    {
        ArgumentNullException.ThrowIfNull(filter);
        return new HostStatisticsRankingFilterDTO
        {
            StartDate = filter.StartDate,
            EndDate = filter.EndDate,
            Take = filter.Take,
            Skip = filter.Skip,
            SortBy = filter.SortBy
        };
    }
}
