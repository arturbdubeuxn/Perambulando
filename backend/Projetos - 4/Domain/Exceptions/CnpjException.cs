namespace Projetos___4.Domain.Exceptions;

public enum CnpjFailure { Invalid, NotFound, Inactive, Duplicate, Unavailable }

public class CnpjException : Exception
{
    public CnpjFailure Failure { get; }
    public CnpjException(CnpjFailure failure, string message) : base(message)
    {
        Failure = failure;
    }
}
