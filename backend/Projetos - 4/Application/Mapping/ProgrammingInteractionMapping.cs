using Projetos___4.Application.DTO;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping;
public class ProgrammingInteractionMapping : IProgrammingInteractionMapping
{
    public ProgrammingInteraction ToModel(ProgrammingInteractionDTO dto, int programmingId, string? userId)
    {
        ArgumentNullException.ThrowIfNull(dto);
        if (dto.Type == null)
        {
            throw new ArgumentException("Informe o tipo da interação.");
        }
        return new ProgrammingInteraction
        {
            EventId = dto.EventId, 
            Type = dto.Type.Value,
            ProgrammingId = programmingId,
            UserId = userId
        };
    }
}
