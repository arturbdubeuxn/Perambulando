using System.ComponentModel.DataAnnotations;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Validations.Interfaces;

namespace Projetos___4.Application.Validations.Validations.Programming;

public class ProgrammingEditValidation : IValidation<ProgrammingEditDTO>
{
    public void Validate(ProgrammingEditDTO dto, DateTime now)
    {
        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true))
        {
            throw new ArgumentException(string.Join(" ", results.Select(result => result.ErrorMessage)));
        }

        // The AppService enumerates the list before invoking domain validation.
        if (dto.categoryIds == null)
        {
            throw new ArgumentException("Informe a lista de categorias da programação.");
        }
    }
}