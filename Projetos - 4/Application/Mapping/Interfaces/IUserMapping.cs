using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IUserMapping
{
    User ToModel(UserDTO dto);
    User ToEditModel(UserDTO dto);
    UserProfileDTO ToDTO(User user);
}
