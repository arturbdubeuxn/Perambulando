using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Validations.Interface
{
    public interface ISumarryStatitcsValidations
    {
        Task<HostStatisticsFilter> Validate(int hostId, string? userId, HostStatisticsFilter filter);
    }
}
