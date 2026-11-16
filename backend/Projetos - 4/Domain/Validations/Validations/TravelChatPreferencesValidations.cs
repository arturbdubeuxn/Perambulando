using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Validations.Validations;

public class TravelChatPreferencesValidations : ITravelChatPreferencesValidations
{
    private readonly ICategoryService _categoryService;

    public TravelChatPreferencesValidations(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    public async Task Validate(TravelChatPreferences preferences)
    {
        ArgumentNullException.ThrowIfNull(preferences);

        if (preferences.City != null && (string.IsNullOrWhiteSpace(preferences.City) || preferences.City.Length > 150))
        {
            throw new ArgumentException("Informe uma cidade válida com até 150 caracteres.");
        }

        if (preferences.Participants.HasValue && preferences.Participants.Value <= 0)
        {
            throw new ArgumentException("A quantidade de pessoas deve ser maior que zero.");
        }

        if (preferences.Budget.HasValue && (preferences.Budget.Value < 0 || decimal.Round(preferences.Budget.Value, 2) != preferences.Budget.Value))
        {
            throw new ArgumentException("O orçamento deve ser não negativo e ter até duas casas decimais.");
        }

        if ((preferences.BudgetBasis.HasValue && !Enum.IsDefined(preferences.BudgetBasis.Value)) ||
            (preferences.BudgetScope.HasValue && !Enum.IsDefined(preferences.BudgetScope.Value)))
        {
            throw new ArgumentException("Informe uma base e um escopo de orçamento válidos.");
        }

        if (preferences.HasBudgetLimit == false &&
            (preferences.Budget.HasValue || preferences.BudgetBasis.HasValue || preferences.BudgetScope.HasValue))
        {
            throw new ArgumentException("Orçamento sem limite não pode conter valor, base ou escopo de limite.");
        }

        if (preferences.HasTimeRestriction == false &&
            (preferences.StartTime.HasValue || preferences.EndTime.HasValue || preferences.EndsNextDay == true))
        {
            throw new ArgumentException("Preferência sem restrição de horário não pode conter um período restrito.");
        }

        if (preferences.StartTime.HasValue && preferences.EndTime.HasValue && preferences.EndsNextDay.HasValue)
        {
            var duration = preferences.EndTime.Value.Ticks - preferences.StartTime.Value.Ticks;
            if (preferences.EndsNextDay.Value)
            {
                duration += TimeSpan.TicksPerDay;
            }

            if (duration <= 0 || duration > TimeSpan.TicksPerDay)
            {
                throw new ArgumentException("O período do passeio deve durar mais de zero e até 24 horas.");
            }
        }

        ArgumentNullException.ThrowIfNull(preferences.Intents);
        foreach (var intent in preferences.Intents)
        {
            ArgumentNullException.ThrowIfNull(intent);
            ArgumentNullException.ThrowIfNull(intent.CategoriesId);
            ArgumentNullException.ThrowIfNull(intent.HostTypes);

            if (intent.CategoriesId.Count > 100 || intent.CategoriesId.Any(id => id <= 0))
            {
                throw new ArgumentException("Informe até 100 IDs positivos de categorias por intenção.");
            }

            if (intent.HostTypes.Any(type => type != Hosts.TypeofHost.Gastronomy && type != Hosts.TypeofHost.Business))
            {
                throw new ArgumentException("As paradas de hosts devem ser de gastronomia ou comércio.");
            }

        }

        var categoryIds = preferences.Intents.SelectMany(intent => intent.CategoriesId).Distinct().ToList();
        if (categoryIds.Count > 0)
        {
            var categories = await _categoryService.GetallCategories();
            var activeIds = categories.Where(category => category.IsActive).Select(category => category.Id).ToHashSet();
            if (categoryIds.Any(id => !activeIds.Contains(id)))
            {
                throw new ArgumentException("Uma ou mais categorias não existem ou estão inativas.");
            }
        }
    }
}
