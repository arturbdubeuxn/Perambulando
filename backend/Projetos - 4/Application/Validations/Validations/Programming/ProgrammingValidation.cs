using Projetos___4.Application.DTO;
using Projetos___4.Application.Validations.Interfaces;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;
using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.Validations.Validations.Programming;

public class ProgrammingValidation : IValidation<ProgrammingDTO>
{
    public void Validate(ProgrammingDTO dto, DateTime now)
    {
        ArgumentNullException.ThrowIfNull(dto);

     
        if (dto.categoryIds.Count() == 0)
        {
            throw new ArgumentException("Selecione pelo menos uma categoria para a programação.");
        }

        if (dto.StartDate.Kind != DateTimeKind.Utc || dto.EndDate.Kind != DateTimeKind.Utc)
        {
            throw new ArgumentException("Informe as datas em UTC, com o sufixo Z.");
        }

        if (dto.StartDate >= dto.EndDate)
        {
            throw new ArgumentException("A data final deve ser posterior à data inicial.");
        }

        if (decimal.Round(dto.MinPrice, 2) != dto.MinPrice || decimal.Round(dto.MaxPrice, 2) != dto.MaxPrice)
        {
            throw new ArgumentException("Os preços devem ter no máximo duas casas decimais.");
        }

        if (dto.MinPrice < 0 || dto.MaxPrice < 0)
        {
            throw new ArgumentException("Os preços devem ser não negativos.");
        }

        if (dto.MinPrice > dto.MaxPrice)
        {
            throw new ArgumentException("O preço mínimo não pode ser maior que o máximo.");
        }

        if (dto.IsFree && (dto.MinPrice != 0 || dto.MaxPrice != 0))
        {
            throw new ArgumentException("Programações gratuitas devem ter preço zero.");
        }

        if (!dto.IsFree && dto.MinPrice == 0 && dto.MaxPrice == 0)
        {
            throw new ArgumentException("Programações pagas devem ter pelo menos um preço maior que zero.");
        }
    }
}
