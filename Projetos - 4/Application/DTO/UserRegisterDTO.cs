using System.ComponentModel.DataAnnotations;
namespace Projetos___4.Application.DTO
{
    public class UserRegisterDTO
    {
        [Required, MaxLength(256)]
        public string Name { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [EnumDataType(typeof(TypeOfUser))]
        public TypeOfUser TypeofUser { get; set; }

        public enum TypeOfUser
        {
            Local = 0,
            Turist = 1
        }

    }
}
