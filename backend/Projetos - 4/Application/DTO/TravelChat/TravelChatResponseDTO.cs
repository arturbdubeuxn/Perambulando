using Projetos___4.Application.DTO.Host;
using Projetos___4.Application.DTO.Programming;

namespace Projetos___4.Application.DTO.TravelChat;

public class TravelChatResponseDTO
{
    public List<ProgrammingResponseDTO> Programmings { get; set; } = new();

    public List<HostResponseDTO> Hosts { get; set; } = new();
}
