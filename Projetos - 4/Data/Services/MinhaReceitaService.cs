using System.Net;
using System.Text.Json;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Services;

public class MinhaReceitaService : ICompanyRegistrationService
{
    private readonly HttpClient _httpClient;
    public MinhaReceitaService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<CompanyRegistration?> GetByCnpjAsync(string cnpj, CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await _httpClient.GetAsync($"https://minhareceita.org/{Uri.EscapeDataString(cnpj)}", cancellationToken);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }
            if (!response.IsSuccessStatusCode)
            {
                throw new CnpjException(CnpjFailure.Unavailable, "Não foi possível consultar a base de CNPJ. Tente novamente mais tarde.");
            }
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var data = document.RootElement;
            if (data.ValueKind != JsonValueKind.Object)
            {
                throw new JsonException();
            }
            string Read(string key) => data.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String
                ? value.GetString() ?? string.Empty : string.Empty;
            var returnedCnpj = Read("cnpj").Replace(".", "").Replace("/", "").Replace("-", "").ToUpperInvariant();
            if (returnedCnpj != cnpj || string.IsNullOrWhiteSpace(Read("razao_social")) ||
                !data.TryGetProperty("situacao_cadastral", out var status) || status.ValueKind != JsonValueKind.Number ||
                !status.TryGetInt32(out var code) || code is not (1 or 2 or 3 or 4 or 8))
            {
                throw new JsonException();
            }
            return new CompanyRegistration
            {
                CNPJ = returnedCnpj, LegalName = Read("razao_social"), TradeName = Read("nome_fantasia"),
                RegistrationStatus = code, StatusDescription = Read("descricao_situacao_cadastral"), CheckedAt = DateTime.UtcNow,
                Street = string.Join(" ", new[] { Read("descricao_tipo_de_logradouro"), Read("logradouro") }.Where(value => !string.IsNullOrWhiteSpace(value))),
                Number = Read("numero"), Complement = Read("complemento"), Neighborhood = Read("bairro"),
                CEP = Read("cep"), City = Read("municipio"), State = Read("uf")
            };
        }
        catch (HttpRequestException)
        {
            throw new CnpjException(CnpjFailure.Unavailable, "O serviço de CNPJ está indisponível. Tente novamente mais tarde.");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new CnpjException(CnpjFailure.Unavailable, "O serviço de CNPJ demorou para responder. Tente novamente mais tarde.");
        }
        catch (JsonException)
        {
            throw new CnpjException(CnpjFailure.Unavailable, "O serviço de CNPJ retornou dados inválidos. Tente novamente mais tarde.");
        }
    }
}
