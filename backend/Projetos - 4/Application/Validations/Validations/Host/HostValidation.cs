using Projetos___4.Application.Validations.Interfaces;
using Projetos___4.Application.DTO.Host;
using Projetos___4.Domain.Model.Host;

namespace Projetos___4.Application.Validations.Validations.Host;

public class HostValidation : IValidation<HostDTO>
{
    public void Validate(HostDTO dto, DateTime now)
    {
        ArgumentNullException.ThrowIfNull(dto);
        ValidatePrices(dto);

        if (dto.AddressId.HasValue && dto.Address != null)
        {
            throw new ArgumentException("Informe somente o ID de um endereço existente ou um novo endereço.");
        }

        if (!dto.AddressId.HasValue && dto.Address == null)
        {
            throw new ArgumentException("Informe um endereço existente ou um novo endereço para o host.");
        }
    }

    private static void ValidatePrices(HostDTO dto)
    {
        if (dto.Typeofhost == Hosts.TypeofHost.Gastronomy || dto.Typeofhost == Hosts.TypeofHost.Business)
        {
            if (!dto.MinPrice.HasValue || !dto.MaxPrice.HasValue)
            {
                throw new ArgumentException("Informe os valores mínimo e máximo estimados por pessoa para gastronomia e comércio.");
            }
        }
        else if (dto.MinPrice.HasValue || dto.MaxPrice.HasValue)
        {
            throw new ArgumentException("Os valores estimados por pessoa estão disponíveis somente para gastronomia e comércio.");
        }

        if (dto.MinPrice > dto.MaxPrice)
        {
            throw new ArgumentException("O valor mínimo não pode ser maior que o máximo.");
        }
        if (dto.MinPrice.HasValue && (dto.MinPrice < 0 || dto.MinPrice > 9999999999.99m ||
            decimal.Round(dto.MinPrice.Value, 2) != dto.MinPrice.Value) ||
            dto.MaxPrice.HasValue && (dto.MaxPrice < 0 || dto.MaxPrice > 9999999999.99m ||
            decimal.Round(dto.MaxPrice.Value, 2) != dto.MaxPrice.Value))
        {
            throw new ArgumentException("Informe valores não negativos, de até 9999999999,99 e com no máximo duas casas decimais.");
        }
    }
}
