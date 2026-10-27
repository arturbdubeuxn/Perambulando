using System.ComponentModel.DataAnnotations.Schema;

namespace Projetos___4.Domain.Model;

[NotMapped]
public class ProgrammingFilter
{
    public int Take { get; set; } = 10;

    public int Skip { get; set; } = 0;

    public List<int>? CategoriesId { get; set; }

    public string? City { get; set; }

    public string? Text { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool? IsFree { get; set; }

    public decimal? MinPrice { get; set; }

    public decimal? MaxPrice { get; set; }

    public int? HostId { get; set; }
}