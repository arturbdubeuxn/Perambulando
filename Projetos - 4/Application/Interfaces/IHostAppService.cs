using Projetos___4.Application.DTO;
using Projetos___4.Application.AppServices;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Interfaces
{
    public interface IHostAppService
    {

        Task<OperationResult<HostCreatedDTO>> Create(HostRegisterDTO dto, string userId);

        Task<IEnumerable<Hosts>> GetAllHostsbyUserId(string userid);

    }
}
