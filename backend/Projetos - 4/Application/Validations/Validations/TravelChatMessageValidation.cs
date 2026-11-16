using System.ComponentModel.DataAnnotations;
using Projetos___4.Application.DTO.TravelChat;
using Projetos___4.Application.Validations.Interfaces;

namespace Projetos___4.Application.Validations.Validations;

public class TravelChatMessageValidation : IValidation<TravelChatMessageDTO>
{
    public void Validate(TravelChatMessageDTO dto, DateTime now)
    {
        ArgumentNullException.ThrowIfNull(dto);
        ValidateObject(dto);

    }

    private static void ValidateObject(object value)
    {
        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(value, new ValidationContext(value), results, validateAllProperties: true))
        {
            throw new ArgumentException(string.Join(" ", results.Select(result => result.ErrorMessage)));
        }
    }
}
