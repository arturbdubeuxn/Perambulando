using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO;

public class OpeningDaysDTO
{
    [Required, EnumDataType(typeof(DayOfWeek))]
    public DayOfWeek? DayOfWeek { get; set; }

    [Required]
    public bool? IsClosed { get; set; }

    [Required]
    public List<OpeningHoursDTO> Periods { get; set; } = new();
}
