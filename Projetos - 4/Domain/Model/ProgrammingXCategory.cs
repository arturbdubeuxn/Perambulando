namespace Projetos___4.Domain.Model
{
    public class ProgrammingXCategory
    {
        public int Id { get; set; }

        public Programming Programming { get; set; }

        public int ProgrammingId { get; set; }

        public Category Category { get; set; }

        public int CategoryId { get; set; }

    }
}
