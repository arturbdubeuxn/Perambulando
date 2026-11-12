using Projetos___4.Domain.Model.Programming;
namespace Projetos___4.Domain.Interfaces.Service;
public interface IProgrammingInteractionService
{
    Task<ProgrammingInteraction?> AddAsync(ProgrammingInteraction interaction);
}
