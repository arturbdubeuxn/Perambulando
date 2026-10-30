using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service;

public class ProgrammingInteractionService : IProgrammingInteractionService
{
    private readonly IProgrammingInteractionRepository _programmingInteractionRepository;
    private readonly IProgrammingRepository _programmingRepository;
    private readonly IUserService _userService;

    public ProgrammingInteractionService(IProgrammingInteractionRepository programmingInteractionRepository,
        IProgrammingRepository programmingRepository, IUserService userService)
    {
        _programmingInteractionRepository = programmingInteractionRepository;
        _programmingRepository = programmingRepository;
        _userService = userService;
    }

    public async Task AddAsync(ProgrammingInteraction interaction)
    {
        ArgumentNullException.ThrowIfNull(interaction);
        if (interaction.ProgrammingId <= 0 || interaction.EventId == Guid.Empty || !Enum.IsDefined(interaction.Type))
        {
            throw new ArgumentException("Informe programação, EventId e tipo de interação válidos.");
        }
        if (interaction.UserId != null)
        {
            var user = await _userService.GetProfileAsync(interaction.UserId);
            if (user == null || !user.IsActive)
            {
                throw new UnauthorizedAccessException("Usuário indisponível.");
            }
        }

        var existing = await _programmingInteractionRepository.GetByEventIdAsync(interaction.EventId);
        if (existing != null)
        {
            if (existing.ProgrammingId != interaction.ProgrammingId || existing.Type != interaction.Type || existing.UserId != interaction.UserId)
            {
                throw new InteractionConflictException();
            }
            return;
        }

        var programming = await _programmingRepository.GetByIdAsync(interaction.ProgrammingId);
        if (programming == null || !programming.IsActive || !programming.Host.IsActive)
        {
            throw new KeyNotFoundException("Programação indisponível.");
        }
        var owner = await _userService.GetProfileAsync(programming.Host.UserId);
        if (owner == null || !owner.IsActive)
        {
            throw new KeyNotFoundException("Programação indisponível.");
        }
        if (interaction.Type == ProgrammingInteractionType.TicketClick && string.IsNullOrWhiteSpace(programming.TicketUrl))
        {
            throw new ArgumentException("A programação não possui link de ingresso.");
        }

        interaction.CreatedAt = DateTime.UtcNow;
        var saved = await _programmingInteractionRepository.AddAsync(interaction);
        if (saved.ProgrammingId != interaction.ProgrammingId || saved.Type != interaction.Type || saved.UserId != interaction.UserId)
        {
            throw new InteractionConflictException();
        }
    }
}
