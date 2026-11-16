using Projetos___4.Application.DTO.TravelChat;

namespace Projetos___4.Application.Interfaces;

public interface ITravelChatAppService
{
    Task<TravelChatResponseDTO> SendMessageAsync(TravelChatMessageDTO dto, string? userId, CancellationToken cancellationToken = default);
}
