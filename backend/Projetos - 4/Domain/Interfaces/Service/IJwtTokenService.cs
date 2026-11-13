using Projetos___4.Domain.Model;

namespace Projetos___4.Domain.Interfaces.Service;

public interface IJwtTokenService
{
    Task<AuthenticationToken> CreateAsync(User user);
}
