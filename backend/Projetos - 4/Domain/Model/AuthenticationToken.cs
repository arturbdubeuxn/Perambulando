namespace Projetos___4.Domain.Model;

public class AuthenticationToken
{
    public string AccessToken { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public DateTime ExpiresAt { get; set; }
}
