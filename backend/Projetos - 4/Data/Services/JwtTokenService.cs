using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Projetos___4.Domain.Model;
using Projetos___4.Domain.Interfaces.Service;

namespace Projetos___4.Data.Services;

public class JwtTokenService(IConfiguration configuration, UserManager<User> userManager) : IJwtTokenService
{
    public async Task<AuthenticationToken> CreateAsync(User user)
    {
        var expiresAt = DateTime.UtcNow.AddHours(configuration.GetValue<int>("Jwt:ExpirationHours"));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("name", user.UserName ?? string.Empty),
            new("typeofuser", ((int)user.Typeofuser).ToString(System.Globalization.CultureInfo.InvariantCulture), ClaimValueTypes.Integer32)
        };
        foreach (var role in await userManager.GetRolesAsync(user))
        {
            claims.Add(new Claim("role", role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var token = new JwtSecurityToken(configuration["Jwt:Issuer"], configuration["Jwt:Audience"],
            claims, notBefore: DateTime.UtcNow, expires: expiresAt,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new AuthenticationToken
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
            TokenType = "Bearer",
            ExpiresAt = expiresAt
        };
    }
}
