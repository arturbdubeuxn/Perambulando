using System.ComponentModel.DataAnnotations.Schema;
namespace Projetos___4.Domain.Model;
[NotMapped]
public class NearbyFilter
{
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public NearbyDistanceRange DistanceRange { get; set; } = NearbyDistanceRange.UpTo2Km;
    public double? MaxDistanceKm { get; set; }
    public List<int>? CategoriesId { get; set; }
    public bool IncludePreferredHosts { get; set; }
    public int Skip { get; set; }

    public enum NearbyDistanceRange { UpTo2Km = 0, From2To5Km = 1, From5To10Km = 2, From10To20Km = 3 }
}
