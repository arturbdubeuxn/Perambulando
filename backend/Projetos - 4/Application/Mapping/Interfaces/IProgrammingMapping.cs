using Projetos___4.Application.DTO.Programming;
using Projetos___4.Domain.Model.Category;
using Projetos___4.Domain.Model.Host;
using Projetos___4.Domain.Model.Programming;

namespace Projetos___4.Application.Mapping.Interfaces
{
    public interface IProgrammingMapping
    {
        Programming ToModel(ProgrammingDTO dto);
        ProgrammingResponseDTO ToDTO(Programming programming);
        ProgrammingDetailsDTO ToDetailsDTO(Programming programming, Hosts host, IEnumerable<Category>? categories = null);
    }
}
