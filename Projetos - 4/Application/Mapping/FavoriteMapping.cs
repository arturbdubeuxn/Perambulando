using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Projetos___4.Application.Mapping.Interfaces;

namespace Projetos___4.Application.Mapping;

public class FavoriteMapping : IFavoriteMapping
{
    public FavoriteResponseDTO ToDTO(Favorite favorite)
    {
        ArgumentNullException.ThrowIfNull(favorite);
        return new FavoriteResponseDTO
        {
            UserId = favorite.UserId,
            ProgrammingId = favorite.ProgrammingId,
            HostId = favorite.Programming.HostId
        };
    }
}
