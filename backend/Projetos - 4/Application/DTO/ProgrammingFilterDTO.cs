using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO;

public class ProgrammingFilterDTO
{
    [Range(1, 100)]
    public int Take { get; set; } = 10;

    [Range(0, int.MaxValue)]
    public int Skip { get; set; } = 0;

    [MaxLength(100)]
    public List<int>? CategoriesId { get; set; }

    [MaxLength(150)]
    public string? City { get; set; }

    [MaxLength(200)]
    public string? Text { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool? IsFree { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal? MinPrice { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal? MaxPrice { get; set; }

    [Range(1, int.MaxValue)]
    public int? HostId { get; set; }
}