using Projetos___4.Application.DTO.Programming;
using Projetos___4.Domain.Model.Programming;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IProgrammingFilterMapping
{
    ProgrammingFilter ToModel(ProgrammingFilterDTO dto);
    ProgrammingFilterDTO ToDTO(ProgrammingFilter filter);
}
