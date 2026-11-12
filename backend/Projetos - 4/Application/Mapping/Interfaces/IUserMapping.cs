using Projetos___4.Application.DTO.User;
using Projetos___4.Domain.Model.User;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IUserMapping
{
    User ToModel(UserDTO dto);
    User ToEditModel(UserDTO dto);
    UserProfileDTO ToDTO(User user, bool isPro);
}
