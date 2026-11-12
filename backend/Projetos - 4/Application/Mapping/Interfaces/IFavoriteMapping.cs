using Projetos___4.Application.DTO.Favorite;
using Projetos___4.Domain.Model.Favorite;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IFavoriteMapping
{
    Favorite ToModel(string userId, int programmingId);

    FavoriteResponseDTO ToDTO(Favorite favorite);
}
