using Projetos___4.Domain.Model;
namespace Projetos___4.Domain.Interfaces.Repository;
public interface IProgrammingInteractionRepository
{
    Task<ProgrammingInteraction> AddAsync(ProgrammingInteraction interaction);
    Task<ProgrammingInteraction?> GetByEventIdAsync(Guid eventId);
}
