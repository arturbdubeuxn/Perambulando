using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO;

public class ProgrammingEditDTO
{
    [Range(1, int.MaxValue)]
    public int? AddressId { get; set; }
    public AddressCreateDTO? Address { get; set; }
    [Required]
    public string Name { get; set; } = string.Empty;
    [Required]
    public string Description { get; set; } = string.Empty;
    [Required]
    public DateTime? StartDate { get; set; }
    [Required]
    public DateTime? EndDate { get; set; }
    [Required]
    public bool? IsFree { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string TicketUrl { get; set; } = string.Empty;
    public string InstagranUrl { get; set; } = string.Empty;
    [Required]
    public float? MinPrice { get; set; }
    [Required]
    public float? MaxPrice { get; set; }

    [Required, MinLength(1)]
    public List<int> categoryIds { get; set; } = new();

}
