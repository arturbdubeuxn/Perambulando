using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Projetos___4.Application.Mapping.Interfaces;

namespace Projetos___4.Application.Mapping;

public class ProgrammingXCategoryMapping : IProgrammingXCategoryMapping
{
    public ProgrammingXCategory ToModel(int categoryId, int programmingId)
    {
        return new ProgrammingXCategory
        {
            ProgrammingId = programmingId,
            CategoryId = categoryId
        };
    }

    public ProgrammingXCategory ToModel(int categoryId, Programming programming)
    {
        ArgumentNullException.ThrowIfNull(programming);
        return new ProgrammingXCategory
        {
            Programming = programming,
            CategoryId = categoryId
        };
    }

    public ProgrammingXCategoryResponseDTO ToDTO(ProgrammingXCategory link)
    {
        ArgumentNullException.ThrowIfNull(link);
        return new ProgrammingXCategoryResponseDTO
        {
            Id = link.Id,
            ProgrammingId = link.ProgrammingId,
            CategoryId = link.CategoryId
        };
    }
}
