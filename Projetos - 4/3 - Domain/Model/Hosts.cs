namespace Projetos___4._3___Domain.Model
{
    public class Hosts
    {

        public int Id { get; set; }
        public User User { get; set; } = null!;
        public string UserId { get; set; } = null!;

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
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;



        public enum TypeofHost
        {
            Productor = 0,
            Gastronomy = 1,
            Business = 2
        }

    }
}
