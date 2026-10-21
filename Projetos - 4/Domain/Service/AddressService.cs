using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Service;

public class AddressService : IAddressService
{
    private readonly IAddressRepository _addressRepository;
    private readonly IGeocodingService _geocodingService;
    public AddressService(IAddressRepository repository, IGeocodingService geocodingService)
    {
        _addressRepository = repository;
        _geocodingService = geocodingService;
    }
    public Task<List<Address>> GetAllAddressAsync(string search)
    {
        return _addressRepository.GetAllAddressAsync(search);
    }

    public Task<Address?> GetByIdAsync(int id)
    {
        return _addressRepository.GetByIdAsync(id);
    }

    public async Task<Address> AddAddress(int addressId, Address? newAddress, string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("Informe o usuário.", nameof(userId));
        }

        if (addressId < 0 || (addressId > 0 && newAddress != null) || (addressId == 0 && newAddress == null))
        {
            throw new ArgumentException("Informe somente o ID de um endereço existente ou um novo endereço.");
        }

        Address address;

        if (addressId > 0)
        {
            var existing = await _addressRepository.GetByIdAsync(addressId);
            if (existing == null)
            {
                throw new ArgumentException("Endereço não encontrado.", nameof(addressId));
            }

            address = existing;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(newAddress!.Street) || string.IsNullOrWhiteSpace(newAddress.Number))
            {
                throw new ArgumentException("Informe o logradouro e o número do endereço.", nameof(newAddress));
            }

            newAddress.Street = newAddress.Street.Trim();
            newAddress.Number = newAddress.Number.Trim();
            newAddress.Complement = newAddress.Complement?.Trim() ?? string.Empty;
            newAddress.Neighborhood = newAddress.Neighborhood?.Trim() ?? string.Empty;
            newAddress.CEP = new string((newAddress.CEP ?? string.Empty).Where(char.IsAsciiDigit).ToArray());

            if (newAddress.CEP.Length != 8)
            {
                throw new ArgumentException("Informe um CEP com oito dígitos.", nameof(newAddress));
            }

            var existing = await _addressRepository.GetExistingAddressAsync(newAddress);
            if (existing != null)
            {
                address = existing;
            }
            else
            {
                newAddress.AddWho = userId;
                address = newAddress;
            }
        }

        if (address.Location == null)
        {
            address.Location = await _geocodingService.GeocodeAsync(
                new GeocodingAddress(address.Street, address.Number, address.Neighborhood, address.CEP));
        }

        return address;
    }
}
