using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Validations.Interface;

public interface ITravelChatPreferencesValidations
{
    Task Validate(TravelChatPreferences preferences);
}
