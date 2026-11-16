using Projetos___4.Application.DTO.TravelChat;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.Validations.Interfaces;
using Projetos___4.Domain.Interfaces.Service;

namespace Projetos___4.Application.AppServices;

public class TravelChatAppService : ITravelChatAppService
{
    private readonly IValidation<TravelChatMessageDTO> _travelChatMessageValidation;
    private readonly ITravelChatMapping _travelChatMapping;
    private readonly ITravelChatService _travelChatService;

    public TravelChatAppService(IValidation<TravelChatMessageDTO> travelChatMessageValidation,
        ITravelChatMapping travelChatMapping, ITravelChatService travelChatService)
    {
        _travelChatMessageValidation = travelChatMessageValidation;
        _travelChatMapping = travelChatMapping;
        _travelChatService = travelChatService;
    }

    public async Task<TravelChatResponseDTO> SendMessageAsync(TravelChatMessageDTO dto, string? userId, CancellationToken cancellationToken = default)
    {
        _travelChatMessageValidation.Validate(dto, DateTime.UtcNow);
        var message = _travelChatMapping.ToModel(dto);
        var response = await _travelChatService.SendMessageAsync(message, userId, cancellationToken);
        return _travelChatMapping.ToDTO(response);
    }
}
