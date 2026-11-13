using Microsoft.VisualBasic;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Validations.Validations
{
    public class ProgrammingInteractionValidation : IProgrammingInteractionValidation
    {

        private readonly IUserService _userService;
        private readonly IProgrammingInteractionRepository _programmingInteractionRepository;
        private readonly IProgrammingRepository _programmingRepository;
        public ProgrammingInteractionValidation(IUserService userService,IProgrammingInteractionRepository programmingInteractionRepository, IProgrammingRepository programmingRepository)
        {
            _userService = userService;
            _programmingInteractionRepository = programmingInteractionRepository;
            _programmingRepository = programmingRepository;
        }
        public async Task Validate(ProgrammingInteraction interaction)
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

        }
    }
}
