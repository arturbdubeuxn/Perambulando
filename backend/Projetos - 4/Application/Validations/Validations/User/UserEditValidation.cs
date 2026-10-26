using System.ComponentModel.DataAnnotations;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Validations.Interfaces;

namespace Projetos___4.Application.Validations.Validations.User;

public class UserEditValidation : IValidation<UserEditDTO>
{
    public void Validate(UserEditDTO dto, DateTime now)
    {
        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true))
        {
            throw new ArgumentException(string.Join(" ", results.Select(result => result.ErrorMessage)));
        }
    }
}