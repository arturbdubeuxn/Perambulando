using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Validations.Validations;

public class ProgrammingValidations : IProgrammingValidations
{
    public void ValidateProgramming(Programming programming, IReadOnlyCollection<ProgrammingXCategory> links, DateTime now)
    {
        ArgumentNullException.ThrowIfNull(programming);
        ArgumentNullException.ThrowIfNull(links);

        if (programming.HostId <= 0)
        {
            throw new ArgumentException("O ID do host deve ser maior que zero.");
        }

        if (links.Count == 0)
        {
            throw new ArgumentException("Selecione pelo menos uma categoria para a programação.");
        }

        if (links.Any(link => link == null || link.CategoryId <= 0))
        {
            throw new ArgumentException("Informe IDs de categorias maiores que zero.");
        }

        if (links.Select(link => link.CategoryId).Distinct().Count() != links.Count)
        {
            throw new ArgumentException("Informe categorias sem repetição.");
        }

        if (programming.StartDate.Kind != DateTimeKind.Utc || programming.EndDate.Kind != DateTimeKind.Utc)
        {
            throw new ArgumentException("Informe as datas em UTC, com o sufixo Z.");
        }

        if (programming.StartDate <= now)
        {
            throw new ArgumentException("A data de início deve ser posterior à data atual.");
        }

        if (programming.StartDate >= programming.EndDate)
        {
            throw new ArgumentException("A data final deve ser posterior à data inicial.");
        }

        if (!float.IsFinite(programming.MinPrice) || !float.IsFinite(programming.MaxPrice))
        {
            throw new ArgumentException("Os preços devem ser valores finitos.");
        }

        if (programming.MinPrice < 0 || programming.MaxPrice < 0)
        {
            throw new ArgumentException("Os preços devem ser não negativos.");
        }

        if (programming.MinPrice > programming.MaxPrice)
        {
            throw new ArgumentException("O preço mínimo não pode ser maior que o máximo.");
        }

        if (programming.IsFree && (programming.MinPrice != 0 || programming.MaxPrice != 0))
        {
            throw new ArgumentException("Programações gratuitas devem ter preço zero.");
        }

        if (!programming.IsFree && programming.MinPrice == 0 && programming.MaxPrice == 0)
        {
            throw new ArgumentException("Programações pagas devem ter pelo menos um preço maior que zero.");
        }

        if (programming.AddressId < 0 || (programming.Address != null && programming.Address.Id < 0))
        {
            throw new ArgumentException("O ID do endereço deve ser maior que zero.");
        }

        if (programming.AddressId <= 0 && programming.Address == null)
        {
            throw new ArgumentException("Informe somente o ID de um endereço existente ou um novo endereço.");
        }

        // An existing navigation matching the FK is the selected address, not a new address.
        if (programming.AddressId > 0 && programming.Address != null &&
            programming.Address.Id != programming.AddressId)
        {
            throw new ArgumentException("Informe somente o ID de um endereço existente ou um novo endereço.");
        }
    }
}