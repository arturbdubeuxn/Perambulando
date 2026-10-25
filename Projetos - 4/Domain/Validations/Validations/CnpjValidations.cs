using System.Text.RegularExpressions;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Validations.Interface;

namespace Projetos___4.Domain.Validations.Validations;

public class CnpjValidations : ICnpjValidations
{
    public string ValidateCnpj(string? cnpj)
    {
        var value = (cnpj ?? string.Empty).Trim().ToUpperInvariant();
        if (!Regex.IsMatch(value, @"^(?:[A-Z0-9]{12}[0-9]{2}|[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}/[A-Z0-9]{4}-[0-9]{2})$"))
        {
            throw new CnpjException(CnpjFailure.Invalid, "Informe um CNPJ válido, com ou sem máscara.");
        }
        value = value.Replace(".", "").Replace("/", "").Replace("-", "");
        if (value.Distinct().Count() == 1)
        {
            throw new CnpjException(CnpjFailure.Invalid, "Os dígitos verificadores do CNPJ são inválidos.");
        }
        for (var length = 12; length <= 13; length++)
        {
            var sum = 0;
            var weight = 2;
            for (var i = length - 1; i >= 0; i--)
            {
                sum += (value[i] - '0') * weight;
                weight = weight == 9 ? 2 : weight + 1;
            }
            var remainder = sum % 11;
            var digit = remainder < 2 ? 0 : 11 - remainder;
            if (value[length] - '0' != digit)
            {
                throw new CnpjException(CnpjFailure.Invalid, "Os dígitos verificadores do CNPJ são inválidos.");
            }
        }
        return value;
    }
}
