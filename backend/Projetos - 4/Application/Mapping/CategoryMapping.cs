using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.DTO.Category;
using Projetos___4.Domain.Model.Category;

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
