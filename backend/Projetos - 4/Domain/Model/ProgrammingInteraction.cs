namespace Projetos___4.Domain.Model;

public class ProgrammingInteraction
{
    public long Id { get; set; }
    public Guid EventId { get; set; }
    public Programming Programming { get; set; } = null!;
    public int ProgrammingId { get; set; }
    public ProgrammingInteractionType Type { get; set; }
    public User? User { get; set; }
    public string? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public enum ProgrammingInteractionType
{
    DetailView = 0,
    CarouselClick = 1,
    TicketClick = 2,
    NearbyClick = 3
}
