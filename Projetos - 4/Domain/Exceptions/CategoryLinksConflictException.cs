namespace Projetos___4.Domain.Exceptions;

public class CategoryLinksConflictException : Exception
{
    public CategoryLinksConflictException() : base("As categorias foram alteradas por outra requisição. Recarregue os dados e tente novamente.")
    {
    }
}
