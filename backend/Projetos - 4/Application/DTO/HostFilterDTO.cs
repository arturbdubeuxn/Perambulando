using Projetos___4.Domain.Model;

namespace Projetos___4.Application.DTO
{
    public class HostFilterDTO
    {
        public string? Name { get; set; }

        public List<Hosts.TypeofHost>? Types { get; set; }

        public string? City { get; set; }

        public bool? HasProgrammings { get; set; }

        public int Take { get; set; } = 10;

        public int Skip { get; set; } = 0;
    }
}
