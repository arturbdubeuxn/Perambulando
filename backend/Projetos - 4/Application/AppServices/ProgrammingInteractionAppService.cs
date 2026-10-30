using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Interfaces.Service;
namespace Projetos___4.Application.AppServices;
public class ProgrammingInteractionAppService : IProgrammingInteractionAppService
{
    private readonly IProgrammingInteractionService _programmingInteractionService;
    private readonly IProgrammingInteractionMapping _programmingInteractionMapping;
    public ProgrammingInteractionAppService(IProgrammingInteractionService programmingInteractionService,
        IProgrammingInteractionMapping programmingInteractionMapping)
    {
        _programmingInteractionService = programmingInteractionService;
        _programmingInteractionMapping = programmingInteractionMapping;
    }
    public async Task AddAsync(ProgrammingInteractionDTO dto, int programmingId, string? userId)
    {
        var interaction = _programmingInteractionMapping.ToModel(dto, programmingId, userId);
        await _programmingInteractionService.AddAsync(interaction);
    }
}
