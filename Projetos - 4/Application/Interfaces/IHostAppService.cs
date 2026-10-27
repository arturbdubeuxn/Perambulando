using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Interfaces
{
    public interface IHostAppService
    {

        Task<CompanyRegistrationDTO> GetByCnpjAsync(string cnpj, CancellationToken cancellationToken = default);

        Task<HostCreatedDTO?> Create(HostDTO dto, string userId);

        Task<HostDetailsDTO?> GetByIdAsync(int hostId);

        Task<HostResponseDTO?> EditHostAsync(HostDTO dto, int hostId, string userId);

        Task<HostResponseDTO?> DeleteHostAsync(int hostId, string userId);

        Task<IEnumerable<HostResponseDTO>> GetAllHostsbyUserId(string userid);

        Task<List<HostResponseDTO>> FilterAsync(HostFilterDTO dto);

    }
}
