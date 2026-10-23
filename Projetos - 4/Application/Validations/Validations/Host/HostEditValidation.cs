using Projetos___4.Application.DTO;
using Projetos___4.Application.Validations.Interfaces;

namespace Projetos___4.Application.Validations.Validations.Host;

public class HostEditValidation : IValidation<HostEditDTO>
{
    public void Validate(HostEditDTO dto, DateTime now)
    {
        if (dto.AddressId.HasValue && dto.AddressId.Value <= 0)
        {
            throw new ArgumentException("O ID do endereço deve ser maior que zero.");
        }

        if ((dto.AddressId.GetValueOrDefault() > 0) == (dto.Address != null))
        {
            throw new ArgumentException("Informe somente o ID de um endereço existente ou um novo endereço.");
        }
    }
}