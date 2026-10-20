namespace Projetos___4.Domain.Exceptions;

public sealed class GeocodingException(string message, bool serviceUnavailable = false) : Exception(message)
{
    public bool ServiceUnavailable { get; } = serviceUnavailable;
}
