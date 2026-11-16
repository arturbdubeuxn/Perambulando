using System.ComponentModel.DataAnnotations;
namespace Projetos___4.Application.DTO.NearBy;
public class NearbyDestinationFilterDTO
{
    [Range(0, int.MaxValue)]
    public int Skip { get; set; }
}
