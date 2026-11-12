namespace Projetos___4.Domain.Model.TravelChat;

public class TravelChatMessage
{
    public string Text { get; set; } = string.Empty;
    public DateTimeOffset ReferenceTime { get; set; }
    public List<Category> Categories { get; set; } = new();
}
