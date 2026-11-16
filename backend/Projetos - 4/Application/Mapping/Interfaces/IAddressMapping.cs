using Projetos___4.Application.DTO.Address;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IAddressMapping
{
    Address ToModel(AddressCreateDTO dto);
    AddressDetailsDTO ToDTO(Address address);
    PostalAddressDTO ToPostalDTO(PostalAddress address);
}
