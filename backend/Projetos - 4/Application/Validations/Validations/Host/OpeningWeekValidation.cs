using System.ComponentModel.DataAnnotations;
using Projetos___4.Application.DTO.OpeningDays;
using Projetos___4.Application.Validations.Interfaces;

namespace Projetos___4.Application.Validations.Validations.Host;

public class OpeningWeekValidation : IValidation<OpeningWeekDTO>
{
    public void Validate(OpeningWeekDTO dto, DateTime now)
    {
        ArgumentNullException.ThrowIfNull(dto);
        ValidateObject(dto);

        foreach (var day in dto.Days)
        {
            ArgumentNullException.ThrowIfNull(day);
            ValidateObject(day);

            foreach (var period in day.Periods)
            {
                ArgumentNullException.ThrowIfNull(period);
                ValidateObject(period);
            }
        }
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
