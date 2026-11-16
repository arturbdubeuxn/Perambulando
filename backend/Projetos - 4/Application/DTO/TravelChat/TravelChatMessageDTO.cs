using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO.TravelChat;

public class TravelChatMessageDTO
{
    [Required, MaxLength(4000)]
    public string Text { get; set; } = string.Empty;
}
