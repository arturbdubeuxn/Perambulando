namespace Projetos___4.Application.DTO.NearBy;
public class NearbyItemResponseDTO
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty; //host ou programação
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public double DistanceMeters { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}
