namespace Projetos___4._2___Application.DTO
{
    public class UserRegisterDTO
    {
        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public TypeOfUser TypeofUser { get; set; }

        public enum TypeOfUser
        {
            Local = 0,
            Turist = 1
        }

    }
}
