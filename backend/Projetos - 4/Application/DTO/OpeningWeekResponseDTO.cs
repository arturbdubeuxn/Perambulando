namespace Projetos___4.Application.DTO;

public class OpeningWeekResponseDTO
{
    public int HostId { get; set; }
    public List<OpeningDaysResponseDTO> Days { get; set; } = new();
}
