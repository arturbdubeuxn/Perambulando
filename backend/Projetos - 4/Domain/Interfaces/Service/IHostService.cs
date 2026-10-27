using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Projetos___4.Application.AppServices;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IHostService
    {

        Task<CompanyRegistration> GetByCnpjAsync(string cnpj, CancellationToken cancellationToken = default);

        Task<Hosts?> Create(Hosts host,string userId);

        Task<Hosts?> GetByIdAsync(int hostId);

        Task<Hosts?> EditHostAsync(Hosts host, string userId);

        Task<Hosts?> DeleteHostAsync(int hostId, string userId);

        Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userId);

        Task<List<Hosts>> FilterAsync(HostFilter filter);


    }
}
