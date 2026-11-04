using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO;

public class OpeningWeekDTO
{
    [Required]
    public List<OpeningDaysDTO> Days { get; set; } = new();
}
