namespace Projetos___4.Application.DTO;

public class ItineraryResponseDTO
{
    public int NumberOfPeople { get; set; }
    public decimal? BudgetPerPerson { get; set; }
    public decimal? TotalBudget { get; set; }
    public List<ItineraryOptionDTO> Itineraries { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}
