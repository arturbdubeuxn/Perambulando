namespace Projetos___4.Domain.Exceptions;

public class CategoryNotFoundException : Exception
{
    public CategoryNotFoundException(Exception? innerException = null)
        : base("Uma ou mais categorias informadas não existem.", innerException)
    {
    }
}
