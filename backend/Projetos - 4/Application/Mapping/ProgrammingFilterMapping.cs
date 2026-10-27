using Projetos___4.Application.DTO;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping;

public class ProgrammingFilterMapping : IProgrammingFilterMapping
{
    public ProgrammingFilter ToModel(ProgrammingFilterDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new ProgrammingFilter
        {
            Take = dto.Take,
            Skip = dto.Skip,
            CategoriesId = dto.CategoriesId?.ToList(),
            City = dto.City,
            Text = dto.Text,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsFree = dto.IsFree,
            MinPrice = dto.MinPrice,
            MaxPrice = dto.MaxPrice,
            HostId = dto.HostId
        };
    }

    public ProgrammingFilterDTO ToDTO(ProgrammingFilter filter)
    {
        ArgumentNullException.ThrowIfNull(filter);
        return new ProgrammingFilterDTO
        {
            Take = filter.Take,
            Skip = filter.Skip,
            CategoriesId = filter.CategoriesId?.ToList(),
            City = filter.City,
            Text = filter.Text,
            StartDate = filter.StartDate,
            EndDate = filter.EndDate,
            IsFree = filter.IsFree,
            MinPrice = filter.MinPrice,
            MaxPrice = filter.MaxPrice,
            HostId = filter.HostId
        };
    }
}
