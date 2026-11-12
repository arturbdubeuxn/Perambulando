using Projetos___4.Domain.Model.Host;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Validations.Validations;

public class HostFilterValidations : IHostFilterValidations
{
    public void Validate(HostFilter filter)
    {
        ArgumentNullException.ThrowIfNull(filter);

        if (filter.Take <= 0 || filter.Take > 100)
        {
            throw new ArgumentException("Take deve estar entre 1 e 100.", nameof(filter.Take));
        }
        if (filter.Skip < 0)
        {
            throw new ArgumentException("Skip deve ser maior ou igual a zero.", nameof(filter.Skip));
        }

        if (filter.Types != null && filter.Types.Any(type => !Enum.IsDefined(type)))
        {
            throw new ArgumentException("Informe tipos de host válidos: 0, 1 ou 2.");
        }

        if ((filter.MinPrice.HasValue && (filter.MinPrice.Value < 0 || decimal.Round(filter.MinPrice.Value, 2) != filter.MinPrice.Value)) ||
            (filter.MaxPrice.HasValue && (filter.MaxPrice.Value < 0 || decimal.Round(filter.MaxPrice.Value, 2) != filter.MaxPrice.Value)))
        {
            throw new ArgumentException("Os preços do filtro devem ser não negativos e ter até duas casas decimais.");
        }

        if (filter.MinPrice.HasValue && filter.MaxPrice.HasValue && filter.MinPrice.Value > filter.MaxPrice.Value)
        {
            throw new ArgumentException("O preço mínimo do filtro não pode ser maior que o máximo.");
        }

        if (filter.DayOfWeek.HasValue && !Enum.IsDefined(filter.DayOfWeek.Value))
        {
            throw new ArgumentException("Informe um dia da semana válido, de 0 a 6.");
        }

        if (filter.StartTime.HasValue || filter.EndTime.HasValue || filter.EndsNextDay)
        {
            if (!filter.DayOfWeek.HasValue || !filter.StartTime.HasValue || !filter.EndTime.HasValue)
            {
                throw new ArgumentException("Informe o dia da semana, início e término para filtrar um período de funcionamento.");
            }

            var duration = filter.EndTime.Value.Ticks - filter.StartTime.Value.Ticks;
            if (filter.EndsNextDay)
            {
                duration += TimeSpan.TicksPerDay;
            }

            if (duration <= 0 || duration > TimeSpan.TicksPerDay)
            {
                throw new ArgumentException("O período do filtro deve durar mais de zero e até 24 horas.");
            }
        }
    }
}
