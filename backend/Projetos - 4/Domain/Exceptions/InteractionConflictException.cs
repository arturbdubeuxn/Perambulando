namespace Projetos___4.Domain.Exceptions;
public class InteractionConflictException : Exception
{
    public InteractionConflictException() : base("EventId já utilizado com dados diferentes.") { }
}
