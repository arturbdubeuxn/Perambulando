using System.ComponentModel.DataAnnotations;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Validations.Interfaces;

namespace Projetos___4.Application.Validations.Validations;

public class ItineraryValidation : IValidation<ItineraryRequestDTO>
{
    public void Validate(ItineraryRequestDTO dto, DateTime now)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true))
        {
            throw new ArgumentException(string.Join(" ", results.Select(result => result.ErrorMessage)));
        }

        if (dto.StartDate!.Value.Kind != DateTimeKind.Utc || dto.EndDate!.Value.Kind != DateTimeKind.Utc)
        {
            throw new ArgumentException("Informe as datas em UTC, com o sufixo Z.");
        }

        if (dto.StartDate.Value < now)
        {
            throw new ArgumentException("O início do roteiro não pode estar no passado.");
        }

        if (dto.StartDate.Value >= dto.EndDate.Value)
        {
            throw new ArgumentException("O horário final deve ser posterior ao horário inicial.");
        }

        if (dto.BudgetPerPerson.HasValue && decimal.Round(dto.BudgetPerPerson.Value, 2) != dto.BudgetPerPerson.Value)
        {
            throw new ArgumentException("O orçamento por pessoa deve ter no máximo duas casas decimais.");
        }

        if (dto.AcceptsPaidActivities == true && (!dto.BudgetPerPerson.HasValue || dto.BudgetPerPerson.Value <= 0))
        {
            throw new ArgumentException("Informe um orçamento por pessoa maior que zero para atividades pagas.");
        }

        if (dto.AcceptsPaidActivities == false && dto.BudgetPerPerson.HasValue && dto.BudgetPerPerson.Value != 0)
        {
            throw new ArgumentException("O orçamento deve ser zero ou não informado quando somente atividades gratuitas forem aceitas.");
        }

        if ((dto.Latitude.HasValue && !double.IsFinite(dto.Latitude.Value)) ||
            (dto.Longitude.HasValue && !double.IsFinite(dto.Longitude.Value)))
        {
            throw new ArgumentException("Informe coordenadas finitas.");
        }

        if (dto.UseCurrentLocation == true && (!dto.Latitude.HasValue || !dto.Longitude.HasValue))
        {
            throw new ArgumentException("Informe latitude e longitude para usar a localização atual.");
        }

        if (dto.UseCurrentLocation == false && string.IsNullOrWhiteSpace(dto.City))
        {
            throw new ArgumentException("Informe ao menos a cidade quando a localização atual não for utilizada.");
        }

        if (dto.UseCurrentLocation == false && (dto.Latitude.HasValue || dto.Longitude.HasValue))
        {
            throw new ArgumentException("Envie coordenadas somente quando optar por usar a localização atual.");
        }
    }
}
