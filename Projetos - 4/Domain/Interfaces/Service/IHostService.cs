using Microsoft.AspNetCore.Identity;
using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Projetos___4.Application.AppServices;

namespace Projetos___4.Domain.Interfaces.Service
{
    public interface IHostService
    {

        Task<OperationResult<Hosts>> Create(Hosts host,string userId);

        Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userId);


    }
}
