using Projetos___4.Application.DTO.Category;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface ICategoryMapping
{
    CategoryResponseDTO ToDTO(Category category);
}
