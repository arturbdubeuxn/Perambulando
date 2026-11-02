namespace Projetos___4.Domain.Exceptions;

public class UserForbiddenException : Exception
{
    public UserForbiddenException() : base("Você só pode excluir a própria conta.")
    {
    }
}
