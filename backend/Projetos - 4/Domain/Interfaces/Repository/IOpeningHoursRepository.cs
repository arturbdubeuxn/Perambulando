using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Repository;

public interface IOpeningHoursRepository
{
    Task<List<HostOpeningDay>> GetByHostIdAsync(int hostId);

    Task<List<HostOpeningDay>> EditAsync(List<HostOpeningDay> days, int hostId);
}
