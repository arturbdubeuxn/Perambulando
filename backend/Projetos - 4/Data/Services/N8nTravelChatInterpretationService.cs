using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model.TravelChat;

namespace Projetos___4.Data.Services;

public class N8nTravelChatInterpretationService : ITravelChatInterpretationService
{
    private readonly HttpClient _httpClient;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = false,
        NumberHandling = JsonNumberHandling.Strict,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow
    };
    private static readonly string[] PreferenceProperties = typeof(TravelChatPreferences).GetProperties()
        .Select(property => JsonNamingPolicy.CamelCase.ConvertName(property.Name)).ToArray();
    private static readonly string[] IntentProperties = typeof(TravelChatIntent).GetProperties()
        .Select(property => JsonNamingPolicy.CamelCase.ConvertName(property.Name)).ToArray();

    public N8nTravelChatInterpretationService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<TravelChatPreferences> InterpretAsync(TravelChatMessage message, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        cancellationToken.ThrowIfCancellationRequested();
        if (_httpClient.BaseAddress == null ||
            (_httpClient.BaseAddress.Scheme != Uri.UriSchemeHttp && _httpClient.BaseAddress.Scheme != Uri.UriSchemeHttps))
        {
            throw new TravelChatInterpretationException("O serviço de interpretação não está configurado.", true);
        }

        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(TimeSpan.FromSeconds(30));
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, _httpClient.BaseAddress)
            {
                Content = JsonContent.Create(message, options: JsonOptions)
            };
            request.Headers.Accept.ParseAdd("application/json");
            using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, deadline.Token);
            if (!response.IsSuccessStatusCode)
            {
                throw new TravelChatInterpretationException("O serviço de interpretação está indisponível. Tente novamente mais tarde.", true);
            }

            const int maxResponseBytes = 64 * 1024;
            if (response.Content.Headers.ContentLength > maxResponseBytes)
            {
                throw new JsonException();
            }

            await response.Content.LoadIntoBufferAsync(maxResponseBytes, deadline.Token);
            await using var stream = await response.Content.ReadAsStreamAsync(deadline.Token);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: deadline.Token);
            var data = document.RootElement;
            ValidateObject(data, PreferenceProperties);
            if (data.GetProperty("intents").ValueKind != JsonValueKind.Array)
            {
                throw new JsonException();
            }

            foreach (var intent in data.GetProperty("intents").EnumerateArray())
            {
                ValidateObject(intent, IntentProperties);
                if (intent.GetProperty("description").ValueKind != JsonValueKind.String ||
                    intent.GetProperty("categoriesId").ValueKind != JsonValueKind.Array ||
                    intent.GetProperty("hostTypes").ValueKind != JsonValueKind.Array)
                {
                    throw new JsonException();
                }
            }

            return data.Deserialize<TravelChatPreferences>(JsonOptions) ?? throw new JsonException();
        }
        catch (HttpRequestException ex) when (ex.HttpRequestError == HttpRequestError.ConfigurationLimitExceeded)
        {
            throw new TravelChatInterpretationException("O serviço de interpretação retornou uma resposta inválida. Tente novamente.");
        }
        catch (HttpRequestException)
        {
            throw new TravelChatInterpretationException("O serviço de interpretação está indisponível. Tente novamente mais tarde.", true);
        }
        catch (IOException)
        {
            throw new TravelChatInterpretationException("O serviço de interpretação está indisponível. Tente novamente mais tarde.", true);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new TravelChatInterpretationException("O serviço de interpretação demorou para responder. Tente novamente.", true);
        }
        catch (JsonException)
        {
            throw new TravelChatInterpretationException("O serviço de interpretação retornou uma resposta inválida. Tente novamente.");
        }
    }

    private static void ValidateObject(JsonElement value, string[] properties)
    {
        if (value.ValueKind != JsonValueKind.Object || properties.Any(property => !value.TryGetProperty(property, out _)) ||
            value.EnumerateObject().GroupBy(property => property.Name).Any(group => group.Count() > 1))
        {
            throw new JsonException();
        }
    }
}
