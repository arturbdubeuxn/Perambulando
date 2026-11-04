using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IOpeningHoursMapping
{
    List<HostOpeningDay> ToModel(OpeningWeekDTO dto, int hostId);

    OpeningWeekResponseDTO ToDTO(int hostId, List<HostOpeningDay> days);
}
