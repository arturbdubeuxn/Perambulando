namespace Projetos___4.Application.DTO.OpeningDays;

public class OpeningHoursResponseDTO
{
    public TimeOnly OpeningTime { get; set; }
    public TimeOnly ClosingTime { get; set; }
    public bool ClosesNextDay { get; set; }
}
