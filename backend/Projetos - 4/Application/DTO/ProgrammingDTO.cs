using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO
{
    public class ProgrammingDTO
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
        [Range(typeof(decimal), "0", "9999999999.99", ParseLimitsInInvariantCulture = true)]
        public decimal MinPrice { get; set; }
        [Required]
        [Range(typeof(decimal), "0", "9999999999.99", ParseLimitsInInvariantCulture = true)]
        public decimal MaxPrice { get; set; }
        public List<int> categoryIds { get; set; } = new List<int>();
    }
}
