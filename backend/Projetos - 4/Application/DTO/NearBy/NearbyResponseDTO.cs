namespace Projetos___4.Application.DTO.NearBy;
public class NearbyResponseDTO
{
    public List<NearbyItemResponseDTO> Items { get; set; } = new();
    public int Skip { get; set; }
    public int PageSize { get; set; } = 10;
    public bool HasMore { get; set; }
}
