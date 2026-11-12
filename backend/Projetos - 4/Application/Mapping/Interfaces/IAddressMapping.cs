using Projetos___4.Application.DTO.Address;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Model.Address;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IAddressMapping
{
    Address ToModel(AddressCreateDTO dto);
    AddressDetailsDTO ToDTO(Address address);
    PostalAddressDTO ToPostalDTO(PostalAddress address);
}
