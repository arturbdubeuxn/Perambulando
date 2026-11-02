namespace Projetos___4.Application.DTO;

public class ItineraryOptionDTO
{
    public int Position { get; set; }
    public string Title { get; set; } = string.Empty;
    public string PreferenceExplanation { get; set; } = string.Empty;
    public decimal? EstimatedMinCostPerPerson { get; set; }
    public decimal? EstimatedMaxCostPerPerson { get; set; }
    public List<ItineraryStopDTO> Stops { get; set; } = new();
}
