using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service;

public interface IAddressService
{
    Task<PostalAddress?> GetByCEPAsync(string cep, CancellationToken cancellationToken = default);

    Task<List<Address>> GetAllAddressAsync(string search);

    Task<Address?> GetByIdAsync(int id);

    Task<Address> AddAddress(int addressId, Address? newAddress, string userId);
}
