using Projetos___4.Domain.Model.Host;

namespace Projetos___4.Domain.Model.TravelChat;

public class TravelChatResponse
{
    public List<Programming> Programmings { get; set; } = new();
    public List<Hosts> Hosts { get; set; } = new();
}
