using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Service;

public class TravelChatService : ITravelChatService
{
    private readonly IUserService _userService;
    private readonly ITravelChatInterpretationService _travelChatInterpretationService;
    private readonly ITravelChatPreferencesValidations _travelChatPreferencesValidations;
    private readonly IProgrammingService _programmingService;
    private readonly IHostService _hostService;
    private readonly ICategoryService _categoryService;

    public TravelChatService(IUserService userService, ITravelChatInterpretationService travelChatInterpretationService,
        ITravelChatPreferencesValidations travelChatPreferencesValidations, IProgrammingService programmingService,
        IHostService hostService, ICategoryService categoryService)
    {
        _userService = userService;
        _travelChatInterpretationService = travelChatInterpretationService;
        _travelChatPreferencesValidations = travelChatPreferencesValidations;
        _programmingService = programmingService;
        _hostService = hostService;
        _categoryService = categoryService;
    }

    public async Task<TravelChatResponse> SendMessageAsync(TravelChatMessage message, string? userId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        cancellationToken.ThrowIfCancellationRequested();
        var user = userId == null ? null : await _userService.GetProfileAsync(userId);
        if (userId != null && user == null)
        {
            throw new UnauthorizedAccessException("Usuário indisponível.");
        }

        cancellationToken.ThrowIfCancellationRequested();
        var categories = await _categoryService.GetallCategories();
        cancellationToken.ThrowIfCancellationRequested();
        var preferences = await _travelChatInterpretationService.InterpretAsync(new TravelChatMessage
        {
            Text = message.Text,
            ReferenceTime = DateTimeOffset.UtcNow,
            Categories = categories.Where(category => category.IsActive).OrderBy(category => category.Id).ToList()
        }, cancellationToken);

        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            await _travelChatPreferencesValidations.Validate(preferences);
        }
        catch (ArgumentException)
        {
            throw new TravelChatInterpretationException("O serviço de interpretação retornou preferências inválidas. Tente novamente.");
        }
        cancellationToken.ThrowIfCancellationRequested();
        var programmings = await FilterProgrammingsAsync(preferences, cancellationToken);
        var hosts = await FilterHostsAsync(preferences, cancellationToken);
        return new TravelChatResponse
        {
            Programmings = programmings,
            Hosts = hosts
        };
    }

    private async Task<List<Programming>> FilterProgrammingsAsync(TravelChatPreferences preferences, CancellationToken cancellationToken)
    {
        var programmings = new List<Programming>();
        foreach (var intent in preferences.Intents)
        {
            if (intent.CategoriesId.Count == 0)
            {
                continue;
            }

            var filter = new ProgrammingFilter
            {
                City = preferences.City,
                CategoriesId = intent.CategoriesId.Distinct().ToList(),
                IsFree = preferences.IsFree
            };

            if (preferences.VisitDate.HasValue)
            {
                var date = preferences.VisitDate.Value;
                var hasPeriod = preferences.HasTimeRestriction == true && preferences.StartTime.HasValue &&
                    preferences.EndTime.HasValue && preferences.EndsNextDay.HasValue;
                var startTime = hasPeriod ? preferences.StartTime : null;
                var endTime = hasPeriod ? preferences.EndTime : null;
                filter.StartDate = date.ToDateTime(startTime ?? TimeOnly.MinValue, DateTimeKind.Utc);
                filter.EndDate = date.ToDateTime(endTime ?? TimeOnly.MaxValue, DateTimeKind.Utc);
                if (hasPeriod && preferences.EndsNextDay == true)
                {
                    if (date == DateOnly.MaxValue)
                    {
                        throw new ArgumentException("A data do passeio não permite término no dia seguinte.");
                    }

                    filter.EndDate = filter.EndDate.Value.AddDays(1);
                }
            }

            if (preferences.HasBudgetLimit == true && preferences.BudgetBasis == TravelChatBudgetBasis.PerPerson &&
                preferences.BudgetScope == TravelChatBudgetScope.Stop && preferences.Budget.HasValue)
            {
                filter.MaxPrice = preferences.Budget.Value;
            }

            cancellationToken.ThrowIfCancellationRequested();
            programmings.AddRange(await _programmingService.FilterAsync(filter));
            cancellationToken.ThrowIfCancellationRequested();
        }

        return programmings.DistinctBy(programming => programming.Id)
            .OrderBy(programming => programming.StartDate)
            .ThenBy(programming => programming.Id)
            .Take(10)
            .ToList();
    }

    private async Task<List<Hosts>> FilterHostsAsync(TravelChatPreferences preferences, CancellationToken cancellationToken)
    {
        var hosts = new List<Hosts>();
        foreach (var intent in preferences.Intents)
        {
            if (intent.HostTypes.Count == 0)
            {
                continue;
            }

            var filter = new HostFilter
            {
                City = preferences.City,
                Types = intent.HostTypes.Distinct().ToList()
            };

            if (preferences.VisitDate.HasValue)
            {
                filter.DayOfWeek = preferences.VisitDate.Value.DayOfWeek;
                if (preferences.HasTimeRestriction == true && preferences.StartTime.HasValue &&
                    preferences.EndTime.HasValue && preferences.EndsNextDay.HasValue)
                {
                    filter.StartTime = preferences.StartTime;
                    filter.EndTime = preferences.EndTime;
                    filter.EndsNextDay = preferences.EndsNextDay.Value;
                }
            }

            if (preferences.HasBudgetLimit == true && preferences.BudgetBasis == TravelChatBudgetBasis.PerPerson &&
                preferences.BudgetScope == TravelChatBudgetScope.Stop && preferences.Budget.HasValue)
            {
                filter.MaxPrice = preferences.Budget.Value;
            }

            cancellationToken.ThrowIfCancellationRequested();
            hosts.AddRange(await _hostService.FilterAsync(filter));
            cancellationToken.ThrowIfCancellationRequested();
        }

        return hosts.DistinctBy(host => host.Id)
            .OrderBy(host => host.Name)
            .ThenBy(host => host.Id)
            .Take(10)
            .ToList();
    }
}
