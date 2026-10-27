using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Projetos___4.Application.Mapping.Interfaces;

namespace Projetos___4.Application.Mapping;

public class UserMapping : IUserMapping
{
    public User ToModel(UserDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new User
        {
            UserName = dto.Name,
            Email = dto.Email,
            Typeofuser = dto.TypeofUser!.Value
        };
    }

    public User ToEditModel(UserDTO dto)
    {
        var user = ToModel(dto);
        user.UserName = user.UserName!.Trim();
        user.Email = user.Email!.Trim();
        return user;
    }

    public UserProfileDTO ToDTO(User user, bool isPro)
    {
        ArgumentNullException.ThrowIfNull(user);
        return new UserProfileDTO
        {
            Id = user.Id,
            Name = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            TypeofUser = user.Typeofuser,
            IsPro = isPro,
            CreatedAt = user.CreatedAt
        };
    }
}
