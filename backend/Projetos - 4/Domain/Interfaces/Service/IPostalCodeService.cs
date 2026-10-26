using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service;

public interface IPostalCodeService
{
    Task<PostalAddress?> GetByCEPAsync(string cep, CancellationToken cancellationToken = default);
}
