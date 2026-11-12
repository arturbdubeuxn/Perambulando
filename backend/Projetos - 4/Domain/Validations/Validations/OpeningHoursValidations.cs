using Projetos___4.Domain.Model.OpeningDay;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Validations.Validations;

public class OpeningHoursValidations : IOpeningHoursValidations
{
    public void ValidateWeek(IReadOnlyCollection<HostOpeningDay> days)
    {
        ArgumentNullException.ThrowIfNull(days);

        if (days.Count != 7)
        {
            throw new ArgumentException("Informe os sete dias da semana.");
        }

        if (days.Any(day => day == null || !Enum.IsDefined(day.DayOfWeek)))
        {
            throw new ArgumentException("Informe dias da semana válidos.");
        }

        if (days.Select(day => day.DayOfWeek).Distinct().Count() != 7)
        {
            throw new ArgumentException("Informe os dias da semana sem repetição.");
        }

        var weekTicks = TimeSpan.TicksPerDay * 7;
        var intervals = new List<(long Start, long End)>();

        foreach (var day in days)
        {
            ArgumentNullException.ThrowIfNull(day.Periods);

            if (day.IsClosed && day.Periods.Count > 0)
            {
                throw new ArgumentException("Dias fechados não podem ter períodos de funcionamento.");
            }

            if (!day.IsClosed && day.Periods.Count == 0)
            {
                throw new ArgumentException("Dias abertos devem ter pelo menos um período de funcionamento.");
            }

            foreach (var period in day.Periods)
            {
                ArgumentNullException.ThrowIfNull(period);

                var duration = period.ClosingTime.Ticks - period.OpeningTime.Ticks;
                if (period.ClosesNextDay)
                {
                    duration += TimeSpan.TicksPerDay;
                }

                if (duration <= 0 || duration > TimeSpan.TicksPerDay)
                {
                    throw new ArgumentException("Cada período deve durar mais de zero e até 24 horas. Confira a indicação de fechamento no dia seguinte.");
                }

                var start = (long)day.DayOfWeek * TimeSpan.TicksPerDay + period.OpeningTime.Ticks;
                var end = start + duration;
                intervals.Add((start, end));

                if (end > weekTicks)
                {
                    intervals.Add((start - weekTicks, end - weekTicks));
                }
            }
        }

        var orderedIntervals = intervals.OrderBy(interval => interval.Start).ToList();
        for (var index = 1; index < orderedIntervals.Count; index++)
        {
            if (orderedIntervals[index].Start < orderedIntervals[index - 1].End)
            {
                throw new ArgumentException("Os períodos de funcionamento não podem se sobrepor, inclusive entre dias e na virada da semana.");
            }
        }
    }
}
