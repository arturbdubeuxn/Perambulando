using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Projetos___4.Application.Mapping.Interfaces;

namespace Projetos___4.Application.Mapping;

public class CategoryMapping : ICategoryMapping
{
    public CategoryResponseDTO ToDTO(Category category)
    {
        ArgumentNullException.ThrowIfNull(category);
        return new CategoryResponseDTO
        {
            Id = category.Id,
            Name = category.Name,
            IsActive = category.IsActive
        };
    }
}
