using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IProgrammingFilterMapping
{
    ProgrammingFilter ToModel(ProgrammingFilterDTO dto);
    ProgrammingFilterDTO ToDTO(ProgrammingFilter filter);
}
