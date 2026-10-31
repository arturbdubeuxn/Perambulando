using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Service;

public class ProgrammingInteractionService : IProgrammingInteractionService
{
    private readonly IProgrammingInteractionRepository _programmingInteractionRepository;
    private readonly IProgrammingInteractionValidation _programmingInteractionValidation;
    private readonly IProgrammingRepository _programmingRepository;
    public ProgrammingInteractionService(IProgrammingInteractionRepository programmingInteractionRepository,IProgrammingInteractionValidation programmingInteractionValidation,
        IProgrammingRepository programmingRepository)
    {
        _programmingInteractionRepository = programmingInteractionRepository;
        _programmingInteractionValidation = programmingInteractionValidation;
        _programmingRepository = programmingRepository;
    }

    public async Task<ProgrammingInteraction?> AddAsync(ProgrammingInteraction interaction)
    {

        await _programmingInteractionValidation.Validate(interaction);

        var saved = await _programmingInteractionRepository.GetByEventIdAsync(interaction.EventId);
        if (saved == null)
        {
            if (interaction.UserId != null)
            {
                var programming = await _programmingRepository.GetByIdAsync(interaction.ProgrammingId);
                if (programming != null && interaction.UserId == programming.Host.UserId)
                {
                    return null;
                }
            }

            interaction.CreatedAt = DateTime.UtcNow;
            saved = await _programmingInteractionRepository.AddAsync(interaction);
        }
        if (saved.ProgrammingId != interaction.ProgrammingId || saved.Type != interaction.Type || saved.UserId != interaction.UserId)
        {
            throw new InteractionConflictException();
        }

        return saved;
    }
}
