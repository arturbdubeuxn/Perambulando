using Projetos___4.Domain.Model.TravelChat;

namespace Projetos___4.Domain.Interfaces.Service;

public interface ITravelChatService
{
    Task<TravelChatResponse> SendMessageAsync(TravelChatMessage message, string? userId, CancellationToken cancellationToken = default);
}
