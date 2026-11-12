namespace Projetos___4.Domain.Model.TravelChat;

public class TravelChatPreferences
{
    public string? City { get; set; }
    public DateOnly? VisitDate { get; set; }
    public bool? HasTimeRestriction { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public bool? EndsNextDay { get; set; }
    public int? Participants { get; set; }
    public bool? HasBudgetLimit { get; set; }
    public decimal? Budget { get; set; }
    public TravelChatBudgetBasis? BudgetBasis { get; set; }
    public TravelChatBudgetScope? BudgetScope { get; set; }
    public bool? IsFree { get; set; }
    public List<TravelChatIntent> Intents { get; set; } = new();
}

public enum TravelChatBudgetBasis
{
    PerPerson = 0,
    Group = 1
}

public enum TravelChatBudgetScope
{
    Itinerary = 0,
    Stop = 1
}
