using Projetos___4.Application.DTO.Programming;
using Projetos___4.Domain.Model.Programming;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IProgrammingXCategoryMapping
{
    ProgrammingXCategory ToModel(int categoryId, int programmingId);
    ProgrammingXCategory ToModel(int categoryId, Programming programming);
    ProgrammingXCategoryResponseDTO ToDTO(ProgrammingXCategory link);
}
