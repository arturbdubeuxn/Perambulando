using System.ComponentModel.DataAnnotations;
namespace Projetos___4.Application.DTO
{
    public class UserXCategoryDTO
    {
        public string UserId { get; set; }

        [Required]
        [MaxLength(3, ErrorMessage = "Selecione no máximo 3 categorias de preferência.")]
        public List<int> CategoryIds { get; set; } = new List<int>();
    }
}
