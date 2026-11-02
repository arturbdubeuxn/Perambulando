namespace Projetos___4.Application.DTO;

public class ItineraryStopDTO
{
    public int Order { get; set; }
    public ProgrammingResponseDTO Programming { get; set; } = new();
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? EstimatedTravelMinutes { get; set; }
}
