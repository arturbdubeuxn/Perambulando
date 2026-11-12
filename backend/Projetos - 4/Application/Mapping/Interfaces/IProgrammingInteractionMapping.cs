using Projetos___4.Application.DTO.Programming;
using Projetos___4.Domain.Model.Programming;
namespace Projetos___4.Application.Mapping.Interfaces;
public interface IProgrammingInteractionMapping
{
    ProgrammingInteraction ToModel(ProgrammingInteractionDTO dto, int programmingId, string? userId);
}
