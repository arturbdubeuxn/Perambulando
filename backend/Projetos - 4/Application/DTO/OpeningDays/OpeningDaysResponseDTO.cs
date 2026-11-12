namespace Projetos___4.Application.DTO.OpeningDays;

public class OpeningDaysResponseDTO
{
    public DayOfWeek DayOfWeek { get; set; }
    public bool IsClosed { get; set; }
    public List<OpeningHoursResponseDTO> Periods { get; set; } = new();
}
