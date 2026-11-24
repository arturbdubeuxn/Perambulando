using NetTopologySuite.Geometries;
using System.ComponentModel.DataAnnotations.Schema;
namespace Projetos___4.Domain.Model;
[NotMapped]
public class NearbyItem
{
    public Point? Location { get; set; }
    public int Id { get; set; }
    public int TargetType { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public double DistanceMeters { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

