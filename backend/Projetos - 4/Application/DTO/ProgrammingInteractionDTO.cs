using System.ComponentModel.DataAnnotations;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.DTO;
public class ProgrammingInteractionDTO
{
    public Guid EventId { get; set; }
    [Required]
    [EnumDataType(typeof(ProgrammingInteractionType))]
    public ProgrammingInteractionType? Type { get; set; }
}
