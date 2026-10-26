using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Interfaces.Service;

namespace Projetos___4.Application.AppServices;

public class AddressAppService : IAddressAppService
{
    private readonly IAddressService _addressService;

    private readonly IAddressMapping _addressMapping;

    public AddressAppService(IAddressService addressService, IAddressMapping addressMapping)
    {
        _addressMapping = addressMapping;
        _addressService = addressService;
    }

    public async Task<PostalAddressDTO?> GetByCEPAsync(string cep, CancellationToken cancellationToken = default)
    {
        var address = await _addressService.GetByCEPAsync(cep, cancellationToken);
        if (address == null)
        {
            return null;
        }

        return _addressMapping.ToPostalDTO(address);
    }

    public async Task<List<AddressDetailsDTO>> GetAllAddressAsync(string search)
    {
        var addresses = await _addressService.GetAllAddressAsync(search);
        return addresses.Select(_addressMapping.ToDTO).ToList();
    }

    public async Task<AddressDetailsDTO> GetDetailsbyIdAsync(int addressId)
    {
        var address = await _addressService.GetByIdAsync(addressId);
        if (address == null)
        {
            throw new ArgumentException("Endereço não encontrado.", nameof(addressId));
        }

        return _addressMapping.ToDTO(address);
    }
}
