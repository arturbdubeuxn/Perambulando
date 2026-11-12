using Projetos___4.Domain.Model.OpeningDay;

namespace Projetos___4.Domain.Interfaces.Service;

public interface IOpeningHoursService
{
    Task<List<HostOpeningDay>> GetByHostIdAsync(int hostId, string userId);

    Task<List<HostOpeningDay>> EditAsync(List<HostOpeningDay> days, int hostId, string userId);
}
