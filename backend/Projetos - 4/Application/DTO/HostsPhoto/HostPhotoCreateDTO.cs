using System.ComponentModel.DataAnnotations;
namespace Projetos___4.Application.DTO.HostsPhoto
{
    public class HostPhotoCreateDTO
    {
        [Range(1, int.MaxValue)]
        public int HostId { get; set; }
        [Required, Url, StringLength(2048)]
        [RegularExpression(@"^https?://.+", ErrorMessage = "Informe uma URL HTTP ou HTTPS.")]
        public string PhotoUrl { get; set; } = string.Empty;
    }
}
