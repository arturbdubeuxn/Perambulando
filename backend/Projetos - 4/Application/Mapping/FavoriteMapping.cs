using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.DTO.Favorite;
using Projetos___4.Domain.Model.Favorite;

namespace Projetos___4.Application.Mapping;

public class FavoriteMapping : IFavoriteMapping
{
    public Favorite ToModel(string userId, int programmingId)
    {
        return new Favorite
        {
            UserId = userId,
            ProgrammingId = programmingId
        };
    }

    public FavoriteResponseDTO ToDTO(Favorite favorite)
    {
        ArgumentNullException.ThrowIfNull(favorite);
        return new FavoriteResponseDTO
        {
            UserId = favorite.UserId,
            ProgrammingId = favorite.ProgrammingId,
        };
    }
}
