using Projetos___4.Application.DTO;
namespace Projetos___4.Application.Interfaces;
public interface IProgrammingInteractionAppService
{
    Task AddAsync(ProgrammingInteractionDTO dto, int programmingId, string? userId);
}
