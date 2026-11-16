namespace Projetos___4.Domain.Exceptions;
public class StatisticsForbiddenException : Exception
{
    public StatisticsForbiddenException() : base("Uma assinatura Pro vigente é necessária para consultar estatísticas.") { }
}
