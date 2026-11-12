using Projetos___4.Application.DTO.Host;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model.Host;

namespace Projetos___4.Application.Mapping;

public class HostFilterMapping : IHostFilterMapping
{
    public HostFilter ToModel(HostFilterDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new HostFilter
        {
            Name = dto.Name,
            Types = dto.Types?.ToList(),
            City = dto.City,
            HasProgrammings = dto.HasProgrammings,
            MinPrice = dto.MinPrice,
            MaxPrice = dto.MaxPrice,
            DayOfWeek = dto.DayOfWeek,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            EndsNextDay = dto.EndsNextDay,
            Take = dto.Take,
            Skip = dto.Skip
        };
    }
}
