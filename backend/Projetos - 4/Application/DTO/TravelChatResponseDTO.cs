namespace Projetos___4.Application.DTO;

public class TravelChatResponseDTO
{
    public List<ProgrammingResponseDTO> Programmings { get; set; } = new();

    public List<HostResponseDTO> Hosts { get; set; } = new();
}
