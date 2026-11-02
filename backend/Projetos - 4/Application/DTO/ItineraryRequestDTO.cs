using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO;

public class ItineraryRequestDTO
{
    [Required]
    public DateTime? StartDate { get; set; }

    [Required]
    public DateTime? EndDate { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int? NumberOfPeople { get; set; }

    [Required]
    public bool? AcceptsPaidActivities { get; set; }

    [Range(typeof(decimal), "0", "9999999999.99", ParseLimitsInInvariantCulture = true)]
    public decimal? BudgetPerPerson { get; set; }

    [Required]
    public bool? UseCurrentLocation { get; set; }

    [StringLength(150)]
    public string? City { get; set; }

    [Range(-90d, 90d)]
    public double? Latitude { get; set; }

    [Range(-180d, 180d)]
    public double? Longitude { get; set; }
}
