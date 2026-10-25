using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service;

public interface ICompanyRegistrationService
{
    Task<CompanyRegistration?> GetByCnpjAsync(string cnpj, CancellationToken cancellationToken = default);
}
