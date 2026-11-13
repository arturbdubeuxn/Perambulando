using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Validations.Validations
{
    public class SumarryStatitcsValidations : ISumarryStatitcsValidations
    {
        private readonly IHostRepository _hostRepository;
        private readonly IUserService _userService;
        private readonly ISubscriptionService _subscriptionService;

        public SumarryStatitcsValidations(IHostRepository hostRepository, IUserService userService,
            ISubscriptionService subscriptionService)
        {
            _hostRepository = hostRepository;
            _userService = userService;
            _subscriptionService = subscriptionService;
        }

        public async Task<HostStatisticsFilter> Validate(int hostId, string? userId, HostStatisticsFilter filter)
        {
            ArgumentNullException.ThrowIfNull(filter);
            if (string.IsNullOrWhiteSpace(userId) || await _userService.GetProfileAsync(userId) == null)
            {
                throw new UnauthorizedAccessException("Usuário indisponível.");
            }
            if (hostId <= 0)
            {
                throw new ArgumentException("O ID do host deve ser maior que zero.");
            }
            if (await _hostRepository.VerificationbyId(hostId, userId) == null)
            {
                throw new KeyNotFoundException("Host não encontrado ou indisponível para este usuário.");
            }
            if (!await _subscriptionService.IsProAsync(userId))
            {
                throw new StatisticsForbiddenException();
            }

            var end = filter.EndDate ?? DateTime.UtcNow;
            var start = filter.StartDate ?? end.AddDays(-30);
            if (start.Kind != DateTimeKind.Utc || end.Kind != DateTimeKind.Utc)
            {
                throw new ArgumentException("Informe as datas em UTC, com o sufixo Z.");
            }
            if (start >= end)
            {
                throw new ArgumentException("A data inicial deve ser anterior à data final.");
            }
            if ((end - start).TotalDays > 366)
            {
                throw new ArgumentException("O período máximo da consulta é de 366 dias.");
            }

            return new HostStatisticsFilter { StartDate = start, EndDate = end };
        }
    }
}
