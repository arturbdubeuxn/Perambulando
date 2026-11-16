using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Validations.Validations
{
    public class RoadmapValidations : IRoadmapValidation
    {
        private readonly IUserService _userService;
        private readonly IProgrammingRepository _programmingRepository;
        private readonly IHostRepository _hostRepository;
        private readonly IOpeningHoursRepository _openingHoursRepository;
        private static readonly TimeZoneInfo HostTimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Recife");

        public RoadmapValidations(IUserService userService, IProgrammingRepository programmingRepository,
            IHostRepository hostRepository, IOpeningHoursRepository openingHoursRepository)
        {
            _userService = userService;
            _programmingRepository = programmingRepository;
            _hostRepository = hostRepository;
            _openingHoursRepository = openingHoursRepository;
        }

        public async Task Validate(Roadmap roadmap)
        {
            ArgumentNullException.ThrowIfNull(roadmap);
            if (roadmap.roadmapProgrammings == null || roadmap.roadmapProgrammings.Count == 0)
            {
                throw new ArgumentException("O roteiro deve possuir pelo menos uma parada.");
            }

            if (roadmap.UserId != null)
            {
                if (string.IsNullOrWhiteSpace(roadmap.UserId))
                {
                    throw new UnauthorizedAccessException("Usuário indisponível.");
                }
                var user = await _userService.GetProfileAsync(roadmap.UserId);
                if (user == null || !user.IsActive)
                {
                    throw new UnauthorizedAccessException("Usuário indisponível.");
                }
            }

            foreach (var stop in roadmap.roadmapProgrammings)
            {
                ArgumentNullException.ThrowIfNull(stop);
                if (stop.StartDate.Kind != DateTimeKind.Utc || stop.EndDate.Kind != DateTimeKind.Utc)
                {
                    throw new ArgumentException("Informe as datas das paradas em UTC, com o sufixo Z.");
                }
                if (stop.StartDate >= stop.EndDate)
                {
                    throw new ArgumentException("O início de cada parada deve ser anterior ao término.");
                }
                if (stop.ProgrammingId.HasValue == stop.HostId.HasValue || stop.ProgrammingId <= 0 || stop.HostId <= 0)
                {
                    throw new ArgumentException("Informe somente um ProgrammingId ou HostId válido por parada.");
                }
            }

            var orderedStops = roadmap.roadmapProgrammings.OrderBy(stop => stop.StartDate).ToList();
            for (var index = 1; index < orderedStops.Count; index++)
            {
                if (orderedStops[index].Order <= orderedStops[index - 1].Order)
                {
                    throw new ArgumentException("A ordem das paradas deve acompanhar os horários, sem posições repetidas.");
                }
                if (orderedStops[index].StartDate < orderedStops[index - 1].EndDate)
                {
                    throw new ArgumentException("As paradas do roteiro não podem ter horários sobrepostos.");
                }
            }

            foreach (var stop in orderedStops)
            {
                if (stop.ProgrammingId.HasValue)
                {
                    var programming = await _programmingRepository.GetByIdAsync(stop.ProgrammingId.Value);
                    if (programming == null || !programming.IsActive || programming.Host == null || !programming.Host.IsActive)
                    {
                        throw new KeyNotFoundException("Programação ou host indisponível.");
                    }
                    if (stop.StartDate < programming.StartDate || stop.EndDate > programming.EndDate)
                    {
                        throw new ArgumentException("A visita deve estar dentro do período da programação.");
                    }
                }
                else
                {
                    var host = await _hostRepository.GetByIdAsync(stop.HostId!.Value);
                    if (host == null || !host.IsActive)
                    {
                        throw new KeyNotFoundException("Host indisponível.");
                    }
                    var days = await _openingHoursRepository.GetByHostIdAsync(host.Id);
                    ValidateOpeningHours(stop, days);
                }
            }
        }

        private void ValidateOpeningHours(RoadmapProgramming stop, List<HostOpeningDay> days)
        {
            var start = TimeZoneInfo.ConvertTimeFromUtc(stop.StartDate, HostTimeZone);
            var end = TimeZoneInfo.ConvertTimeFromUtc(stop.EndDate, HostTimeZone);
            // A visita após meia-noite pode pertencer ao funcionamento do dia anterior.
            foreach (var date in new[] { start.Date, start.Date.AddDays(-1) })
            {
                foreach (var day in days.Where(day => day.DayOfWeek == date.DayOfWeek && !day.IsClosed))
                {
                    foreach (var period in day.Periods)
                    {
                        var opening = date.Add(period.OpeningTime.ToTimeSpan());
                        var closing = date.Add(period.ClosingTime.ToTimeSpan());
                        if (period.ClosesNextDay)
                        {
                            closing = closing.AddDays(1);
                        }
                        if (start >= opening && end <= closing)
                        {
                            return;
                        }
                    }
                }
            }
            throw new ArgumentException("A visita deve caber em um intervalo de funcionamento do host, respeitando o dia da semana.");
        }
    }
}

