using System.Text.Json;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Services;

public class ViaCepService : IPostalCodeService
{
    private readonly HttpClient _httpClient;

    public ViaCepService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<PostalAddress?> GetByCEPAsync(string cep, CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await _httpClient.GetAsync($"https://viacep.com.br/ws/{Uri.EscapeDataString(cep)}/json/", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw new PostalCodeException("O serviço de CEP está indisponível. Preencha o endereço manualmente ou tente novamente.");
            }
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var data = document.RootElement;
            if (data.ValueKind != JsonValueKind.Object)
            {
                throw new JsonException();
            }
            if (data.TryGetProperty("erro", out var error) &&
                (error.ValueKind == JsonValueKind.True || (error.ValueKind == JsonValueKind.String && error.GetString() == "true")))
            {
                return null;
            }
            string Read(string name) => data.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
                ? value.GetString() ?? string.Empty : string.Empty;
            var result = new PostalAddress
            {
                CEP = Read("cep"), Street = Read("logradouro"), Neighborhood = Read("bairro"),
                City = Read("localidade"), State = Read("uf")
            };
            if (result.CEP.Replace("-", "") != cep || string.IsNullOrWhiteSpace(result.City) || result.State.Length != 2)
            {
                throw new JsonException();
            }
            return result;
        }
        catch (HttpRequestException)
        {
            throw new PostalCodeException("O serviço de CEP está indisponível. Preencha o endereço manualmente ou tente novamente.");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new PostalCodeException("O serviço de CEP demorou para responder. Tente novamente.");
        }
        catch (JsonException)
        {
            throw new PostalCodeException("O serviço de CEP retornou uma resposta inválida. Tente novamente.");
        }
    }
}
