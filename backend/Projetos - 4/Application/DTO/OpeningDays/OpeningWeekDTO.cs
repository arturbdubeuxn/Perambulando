using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO.OpeningDays;

public class OpeningWeekDTO
{
    [Required]
    public List<OpeningDaysDTO> Days { get; set; } = new();
}
