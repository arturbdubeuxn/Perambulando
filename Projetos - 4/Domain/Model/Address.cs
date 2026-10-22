using NetTopologySuite.Geometries;
using System.Text.Json.Serialization;

namespace Projetos___4.Domain.Model;

public class Address
{
    public int Id { get; set; }
    public string Street { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string Complement { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string CEP { get; set; } = string.Empty;
    [JsonIgnore]
    public Point? Location { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string AddWho { get; set; } = string.Empty;
}
