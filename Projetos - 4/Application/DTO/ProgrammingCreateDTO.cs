using Projetos___4.Domain.Model;
using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO
{
    public class ProgrammingCreateDTO
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public string Description { get; set; } = string.Empty;
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
        [Required]
        public bool IsFree { get; set; }

        [Range(1, int.MaxValue)]
        public int? AddressId { get; set; }
        public AddressCreateDTO? Address { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string TicketUrl { get; set; } = string.Empty;
        public string InstagranUrl { get; set; } = string.Empty;
        [Required]
        public float MinPrice { get; set; }
        [Required]
        public float MaxPrice { get; set; }
        [Required]
        public List<int> categoryIds { get; set; } = new List<int>();
    }
}
