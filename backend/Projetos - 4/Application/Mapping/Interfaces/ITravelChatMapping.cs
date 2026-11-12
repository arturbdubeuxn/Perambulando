using Projetos___4.Application.DTO.TravelChat;
using Projetos___4.Domain.Model.TravelChat;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface ITravelChatMapping
{
    TravelChatMessage ToModel(TravelChatMessageDTO dto);
    TravelChatResponseDTO ToDTO(TravelChatResponse response);
}
