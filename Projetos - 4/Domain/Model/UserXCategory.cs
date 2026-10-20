namespace Projetos___4.Domain.Model
{
    public class UserXCategory
    {
        public int Id { get; set; }

        public User User { get; set; }

        public string UserId { get; set; }

        public Category Category { get; set; }

        public int CategoryId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
