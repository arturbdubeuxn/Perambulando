using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Validations.Interface;

public interface IOpeningHoursValidations
{
    void ValidateWeek(IReadOnlyCollection<HostOpeningDay> days);
}
