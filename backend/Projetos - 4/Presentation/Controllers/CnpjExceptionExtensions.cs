using Microsoft.AspNetCore.Mvc;
using Projetos___4.Domain.Exceptions;

namespace Projetos___4.Presentation.Controllers;

public static class CnpjExceptionExtensions
{
    public static ObjectResult CnpjProblem(this CnpjException ex, ControllerBase controller)
    {
        var status = ex.Failure switch
        {
            CnpjFailure.Invalid => 400,
            CnpjFailure.NotFound => 404,
            CnpjFailure.Inactive => 422,
            CnpjFailure.Duplicate => 409,
            _ => 503
        };

        return controller.Problem(statusCode: status, title: "Verificação de CNPJ", detail: ex.Message);
    }
}
