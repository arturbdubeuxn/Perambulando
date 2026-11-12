using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service;

public interface ITravelChatInterpretationService
{
    Task<TravelChatPreferences> InterpretAsync(TravelChatMessage message, CancellationToken cancellationToken = default);
}
