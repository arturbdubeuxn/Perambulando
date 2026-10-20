namespace Projetos___4.Application.DTO
{
    public class UserXCategoryDTO
    {
        public string UserId { get; set; }

        public List<int> CategoryIds { get; set; } = new List<int>();
    }
}
