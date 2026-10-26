using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Projetos___4.Application.Mapping.Interfaces;

namespace Projetos___4.Application.Mapping;

public class AddressMapping : IAddressMapping
{
    public Address ToModel(AddressCreateDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new Address
        {
            Street = dto.Street,
            Number = dto.Number,
            Complement = dto.Complement ?? string.Empty,
            Neighborhood = dto.Neighborhood ?? string.Empty,
            CEP = dto.CEP
        };
    }

    public AddressDetailsDTO ToDTO(Address address)
    {
        ArgumentNullException.ThrowIfNull(address);
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

    public PostalAddressDTO ToPostalDTO(PostalAddress address)
    {
        ArgumentNullException.ThrowIfNull(address);
        return new PostalAddressDTO
        {
            CEP = address.CEP,
            Street = address.Street,
            Neighborhood = address.Neighborhood,
            City = address.City,
            State = address.State
        };
    }
}
