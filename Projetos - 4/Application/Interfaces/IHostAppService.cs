using Projetos___4.Application.DTO;
using Projetos___4.Application.AppServices;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Interfaces
{
    public interface IHostAppService
    {

        Task<HostCreatedDTO?> Create(HostRegisterDTO dto, string userId);

        Task<HostDetailsDTO?> GetByIdAsync(int hostId);

        Task<HostResponseDTO?> EditHostAsync(HostEditDTO dto, int hostId, string userId);

        Task<Hosts?> DeleteHostAsync(int hostId, string userId);

        Task<IEnumerable<HostResponseDTO>> GetAllHostsbyUserId(string userid);

    }
}
