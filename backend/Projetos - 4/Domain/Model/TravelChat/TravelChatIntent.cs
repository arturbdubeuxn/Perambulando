using Projetos___4.Domain.Model.Host;

namespace Projetos___4.Domain.Model.TravelChat;

public class TravelChatIntent
{
    public string Description { get; set; } = string.Empty;
    public List<int> CategoriesId { get; set; } = new();
    public List<Hosts.TypeofHost> HostTypes { get; set; } = new();
}
