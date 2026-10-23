using Projetos___4.Domain.Model;
using static Projetos___4.Domain.Model.Hosts;
using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO
{
    public class HostRegisterDTO
    {


        [EnumDataType(typeof(TypeofHost))]
        [Required]
        public TypeofHost Typeofhost { get; set; }

        [MaxLength(18)]
        [Required]
        public string CNPJ { get; set; } = string.Empty;

        [MaxLength(2048)]
        public string LogoUrl { get; set; } = string.Empty;

        [MaxLength(2048)]
        public string InstagranUrl { get; set; } = string.Empty;
        [Range(1, int.MaxValue)]
        public int? AddressId { get; set; }
        public AddressCreateDTO? Address { get; set; }
        [MaxLength(30)]
        public string Phone { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty;
        [Required, MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

    }
}
