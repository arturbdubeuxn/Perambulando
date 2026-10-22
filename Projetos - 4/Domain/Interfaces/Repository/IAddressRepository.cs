using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository;

public interface IAddressRepository
{
    Task<List<Address>> GetAllAddressAsync(string search);

    Task<Address?> GetByIdAsync(int id);

    Task<Address?> GetExistingAddressAsync(Address address);
}
