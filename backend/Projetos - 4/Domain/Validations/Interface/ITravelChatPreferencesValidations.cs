using Projetos___4.Domain.Model.TravelChat;

namespace Projetos___4.Domain.Validations.Interface;

public interface ITravelChatPreferencesValidations
{
    Task Validate(TravelChatPreferences preferences);
}
