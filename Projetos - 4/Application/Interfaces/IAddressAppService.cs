using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Interfaces;

public interface IAddressAppService
{
    Task<List<AddressDetailsDTO>> GetAllAddressAsync(string search);

    Task<AddressDetailsDTO> GetDetailsbyIdAsync(int addressId);
}
