using Projetos___4.Application.DTO;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;

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
            Take = dto.Take,
            Skip = dto.Skip
        };
    }
}
