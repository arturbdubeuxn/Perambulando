using Projetos___4._3___Domain.Model;
using static Projetos___4._3___Domain.Model.Hosts;

namespace Projetos___4._2___Application.DTO
{
    public class HostRegisterDTO
    {


        public TypeofHost Typeofhost { get; set; }

        public string CNPJ { get; set; } = string.Empty;

        public string LogoUrl { get; set; } = string.Empty;

        public string InstagranUrl { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string Neighborhood { get; set; } = string.Empty;

        public string CEP { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

    }
}
