using Projetos___4.Domain.Model.Token;
using Projetos___4.Domain.Model.User;

namespace Projetos___4.Domain.Interfaces.Service;

public interface IJwtTokenService
{
    Task<AuthenticationToken> CreateAsync(User user);
}
