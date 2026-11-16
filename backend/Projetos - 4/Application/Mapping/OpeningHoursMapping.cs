using Projetos___4.Application.DTO.OpeningDays;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping;

public class OpeningHoursMapping : IOpeningHoursMapping
{
    public List<HostOpeningDay> ToModel(OpeningWeekDTO dto, int hostId)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var days = new List<HostOpeningDay>();
        foreach (var dayDto in dto.Days)
        {
            var day = new HostOpeningDay
            {
                HostId = hostId,
                DayOfWeek = dayDto.DayOfWeek!.Value,
                IsClosed = dayDto.IsClosed!.Value
            };

            foreach (var periodDto in dayDto.Periods)
            {
                day.Periods.Add(new HostOpeningPeriod
                {
                    HostOpeningDay = day,
                    OpeningTime = periodDto.OpeningTime!.Value,
                    ClosingTime = periodDto.ClosingTime!.Value,
                    ClosesNextDay = periodDto.ClosesNextDay!.Value
                });
            }

            days.Add(day);
        }

        return days;
    }

    public OpeningWeekResponseDTO ToDTO(int hostId, List<HostOpeningDay> days)
    {
        ArgumentNullException.ThrowIfNull(days);

        return new OpeningWeekResponseDTO
        {
            HostId = hostId,
            Days = days.OrderBy(day => day.DayOfWeek).Select(day => new OpeningDaysResponseDTO
            {
                DayOfWeek = day.DayOfWeek,
                IsClosed = day.IsClosed,
                Periods = day.Periods.OrderBy(period => period.OpeningTime).Select(period => new OpeningHoursResponseDTO
                {
                    OpeningTime = period.OpeningTime,
                    ClosingTime = period.ClosingTime,
                    ClosesNextDay = period.ClosesNextDay
                }).ToList()
            }).ToList()
        };
    }
}
