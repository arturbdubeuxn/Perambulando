using System.ComponentModel.DataAnnotations;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.DTO.NearBy;
public class NearbyUserFilterDTO
{
    [Required, Range(-90d, 90d)]
    public double? Latitude { get; set; }
    [Required, Range(-180d, 180d)]
    public double? Longitude { get; set; }
    [EnumDataType(typeof(NearbyFilter.NearbyDistanceRange))]
    public NearbyFilter.NearbyDistanceRange DistanceRange { get; set; } = NearbyFilter.NearbyDistanceRange.UpTo2Km;
    [Range(1d, 20d)]
    public double? MaxDistanceKm { get; set; }
    [MaxLength(100)]
    public List<int>? CategoriesId { get; set; }
    public bool IncludePreferredHosts { get; set; }
    [Range(0, int.MaxValue)]
    public int Skip { get; set; }
}
