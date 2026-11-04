using Projetos___4.Application.DTO;

namespace Projetos___4.Application.Interfaces;

public interface IOpeningHoursAppService
{
    Task<OpeningWeekResponseDTO> GetByHostIdAsync(int hostId, string userId);

    Task<OpeningWeekResponseDTO> EditAsync(OpeningWeekDTO dto, int hostId, string userId);
}
