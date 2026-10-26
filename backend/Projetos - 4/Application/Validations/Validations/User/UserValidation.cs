using System.ComponentModel.DataAnnotations;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Validations.Interfaces;

namespace Projetos___4.Application.Validations.Validations.User;

public class UserValidation : IValidation<UserDTO>
{
    public void Validate(UserDTO dto, DateTime now)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true))
        {
            throw new ArgumentException(string.Join(" ", results.Select(result => result.ErrorMessage)));
        }
    }
}