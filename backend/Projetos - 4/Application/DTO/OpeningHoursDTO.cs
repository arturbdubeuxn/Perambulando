using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO;

public class OpeningHoursDTO
{
    [Required]
    public TimeOnly? OpeningTime { get; set; }

    [Required]
    public TimeOnly? ClosingTime { get; set; }

    [Required]
    public bool? ClosesNextDay { get; set; }
}
