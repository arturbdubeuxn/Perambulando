namespace Projetos___4.Domain.Exceptions;
public class NearbyLocationException : Exception
{
    public NearbyLocationException() : base("O destino não possui coordenadas válidas para consultar os arredores.") { }
}
