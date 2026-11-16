namespace Projetos___4.Domain.Exceptions;

public class CategoryLinksConflictException : Exception
{
    public CategoryLinksConflictException(Exception? innerException = null) : base("As categorias foram alteradas por outra requisição. Recarregue os dados e tente novamente.", innerException)
    {
    }
}
