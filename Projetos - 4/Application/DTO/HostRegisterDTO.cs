using Projetos___4.Domain.Model;
using static Projetos___4.Domain.Model.Hosts;
using System.ComponentModel.DataAnnotations;

namespace Projetos___4.Application.DTO
{
    public class HostRegisterDTO
    {


        public TypeofHost Typeofhost { get; set; }

        public string CNPJ { get; set; } = string.Empty;

        public string LogoUrl { get; set; } = string.Empty;

        public string InstagranUrl { get; set; } = string.Empty;
        [Range(1, int.MaxValue)]
        public int? AddressId { get; set; }
        public AddressCreateDTO? Address { get; set; }
        public string Phone { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

    }
}
