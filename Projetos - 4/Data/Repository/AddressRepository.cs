using Microsoft.EntityFrameworkCore;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Repository;

public class AddressRepository : IAddressRepository
{
    private readonly Context.Context Db;

    public AddressRepository(Context.Context db)
    {
        Db = db;
    }

    public async Task<List<Address>> GetAllAddressAsync(string search)
    {
        if (string.IsNullOrWhiteSpace(search) || search.Count(char.IsLetterOrDigit) < 6)
        {
            return new List<Address>();
        }

        var street = search.Trim().ToUpperInvariant();
        var cep = search.Trim().Replace("-", string.Empty);

        return await Db.Addresses.AsNoTracking()
            .Where(address => address.Street.ToUpper().Contains(street) || address.CEP.Contains(cep))
            .OrderBy(address => address.Street)
            .ThenBy(address => address.Number)
            .ThenBy(address => address.Id)
            .Take(10)
            .ToListAsync();
    }

    public Task<Address?> GetByIdAsync(int id)
    {
        return Db.Addresses.FirstOrDefaultAsync(address => address.Id == id);
    }

    public Task<Address?> GetExistingAddressAsync(Address address)
    {
        var street = address.Street.ToUpperInvariant();
        var number = address.Number.ToUpperInvariant();
        var complement = address.Complement.ToUpperInvariant();
        var neighborhood = address.Neighborhood.ToUpperInvariant();

        return Db.Addresses.Where(existing => existing.Street.Trim().ToUpper() == street &&
                existing.Number.Trim().ToUpper() == number &&
                existing.Complement.Trim().ToUpper() == complement &&
                existing.Neighborhood.Trim().ToUpper() == neighborhood &&
                existing.CEP.Replace("-", string.Empty) == address.CEP)
            .OrderByDescending(existing => existing.Location != null)
            .ThenBy(existing => existing.Id)
            .FirstOrDefaultAsync();
    }
}
