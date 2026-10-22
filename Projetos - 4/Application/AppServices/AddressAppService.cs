using Projetos___4.Application.DTO;
using Projetos___4.Application.Interfaces;
using Projetos___4.Domain.Interfaces.Service;

namespace Projetos___4.Application.AppServices;

public class AddressAppService : IAddressAppService
{
    private readonly IAddressService _addressService;

    public AddressAppService(IAddressService addressService)
    {
        _addressService = addressService;
    }

    public async Task<List<AddressDetailsDTO>> GetAllAddressAsync(string search)
    {
        var addresses = await _addressService.GetAllAddressAsync(search);

        return addresses.Select(address => new AddressDetailsDTO
        {
            Id = address.Id,
            Street = address.Street,
            Number = address.Number,
            Complement = address.Complement,
            Neighborhood = address.Neighborhood,
            CEP = address.CEP
        }).ToList();
    }

    public async Task<AddressDetailsDTO> GetDetailsbyIdAsync(int addressId)
    {
        var address = await _addressService.GetByIdAsync(addressId);
        if (address == null)
        {
            throw new ArgumentException("Endereço não encontrado.", nameof(addressId));
        }

        return new AddressDetailsDTO
        {
            Id = address.Id,
            Street = address.Street,
            Number = address.Number,
            Complement = address.Complement,
            Neighborhood = address.Neighborhood,
            CEP = address.CEP
        };
    }
}
