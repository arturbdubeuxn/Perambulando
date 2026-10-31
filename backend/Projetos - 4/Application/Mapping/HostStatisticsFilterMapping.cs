using Projetos___4.Application.DTO;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping;

public class HostStatisticsFilterMapping : IHostStatisticsFilterMapping
{
    public HostStatisticsFilter ToModel(HostStatisticsFilterDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new HostStatisticsFilter { StartDate = dto.StartDate, EndDate = dto.EndDate };
    }

    public HostStatisticsFilterDTO ToDTO(HostStatisticsFilter filter)
    {
        ArgumentNullException.ThrowIfNull(filter);
        return new HostStatisticsFilterDTO { StartDate = filter.StartDate, EndDate = filter.EndDate };
    }
}
