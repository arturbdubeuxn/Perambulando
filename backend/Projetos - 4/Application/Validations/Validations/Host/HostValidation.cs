using Projetos___4.Application.DTO;
using Projetos___4.Application.Validations.Interfaces;

namespace Projetos___4.Application.Validations.Validations.Host;

public class HostValidation : IValidation<HostDTO>
{
    public void Validate(HostDTO dto, DateTime now)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (dto.AddressId.HasValue && dto.Address != null)
        {
            throw new ArgumentException("Informe somente o ID de um endereço existente ou um novo endereço.");
        }

        if (!dto.AddressId.HasValue && dto.Address == null)
        {
            throw new ArgumentException("Informe um endereço existente ou um novo endereço para o host.");
        }
    }
}
