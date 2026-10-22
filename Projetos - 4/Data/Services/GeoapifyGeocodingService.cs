using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using NetTopologySuite.Geometries;
using Projetos___4.Domain.Exceptions;
using Projetos___4.Domain.Interfaces.Service;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Services;

public sealed class GeoapifyGeocodingService(HttpClient httpClient, IOptions<GeoapifyOptions> options) : IGeocodingService
{
    public async Task<Point> GeocodeAsync(GeocodingAddress address, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(address.Street) || string.IsNullOrWhiteSpace(address.PostalCode))
        {
            throw new GeocodingException("Informe o logradouro e o CEP para localizar o endereço.");
        }

        var apiKey = options.Value.ApiKey;
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new GeocodingException("O serviço de localização não está configurado. Configure Geoapify:ApiKey no backend.", true);
        }

        var postalCode = NormalizePostalCode(address.PostalCode);
        if (postalCode.Length != 8)
        {
            throw new GeocodingException("Informe um CEP com oito dígitos.");
        }

        var formattedPostalCode = postalCode.Insert(5, "-");
        var baseUrl = "https://api.geoapify.com/v1/geocode/search?format=json&limit=5&lang=pt&filter=countrycode:br";
        var structuredUrl = baseUrl + "&street=" + Uri.EscapeDataString(address.Street.Trim())
            + "&postcode=" + Uri.EscapeDataString(formattedPostalCode) + "&country=Brazil";
        var number = NormalizeName(address.Number);
        var hasNumber = number.Length > 0 && number is not ("SN" or "S N" or "SEM NUMERO");
        var firstUrl = hasNumber ? structuredUrl + "&housenumber=" + Uri.EscapeDataString(address.Number.Trim()) : structuredUrl;
        var text = string.Join(", ", new[] { address.Street, address.Neighborhood, formattedPostalCode, "Brasil" }
            .Where(value => !string.IsNullOrWhiteSpace(value)));
        var secondUrl = hasNumber ? structuredUrl : baseUrl + "&text=" + Uri.EscapeDataString(text);
        var keyQuery = "&apiKey=" + Uri.EscapeDataString(apiKey);

        // Duas buscas limitadas a 15 s no total, abaixo do timeout de 20 s do protótipo.
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(TimeSpan.FromSeconds(15));
        try
        {
            var point = await FindCandidateAsync(firstUrl + keyQuery, address, postalCode, deadline.Token);
            if (point != null)
            {
                return point;
            }

            // Retira o número apenas da consulta, preservando o endereço cadastrado.
            point = await FindCandidateAsync(secondUrl + keyQuery, address, postalCode, deadline.Token);
            if (point != null)
            {
                return point;
            }

            throw new GeocodingException("Não foi possível localizar uma aproximação na rua e região informadas. Confira o logradouro, número e CEP.");
        }
        catch (HttpRequestException)
        {
            // Não propagar URI/exceção do provedor: a query contém a chave da API.
            throw new GeocodingException("O serviço de localização está indisponível. Tente novamente mais tarde.", true);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new GeocodingException("O serviço de localização demorou para responder. Tente novamente mais tarde.", true);
        }
        catch (JsonException)
        {
            throw new GeocodingException("O serviço de localização retornou uma resposta inválida.", true);
        }
    }

    private async Task<Point?> FindCandidateAsync(string url, GeocodingAddress address, string postalCode, CancellationToken cancellationToken)
    {
        using var response = await httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new GeocodingException("Não foi possível consultar o serviço de localização. Tente novamente mais tarde.", true);
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        if (document.RootElement.ValueKind != JsonValueKind.Object ||
            !document.RootElement.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array)
        {
            throw new GeocodingException("O serviço de localização retornou uma resposta inválida.", true);
        }

        if (results.GetArrayLength() == 0)
        {
            return null;
        }

        var candidates = new List<(Point Point, bool ExactNumber, bool Building, int PostalMatch, double Confidence)>();
        var hasValidCoordinates = false;
        var street = NormalizeStreet(address.Street);
        var number = NormalizeName(address.Number);
        foreach (var result in results.EnumerateArray())
        {
            if (result.ValueKind != JsonValueKind.Object ||
                !TryCoordinate(result, "lon", -180, 180, out var lon) ||
                !TryCoordinate(result, "lat", -90, 90, out var lat))
            {
                continue;
            }
            hasValidCoordinates = true;

            var type = ReadString(result, "result_type");
            var candidatePostalCode = NormalizePostalCode(ReadString(result, "postcode"));
            // Sem cidade/UF no formulário, o prefixo de três dígitos limita a região da aproximação.
            // Praças e largos podem vir em name/address_line1 em vez de street.
            if (ReadString(result, "country_code") != "br" ||
                type is not ("building" or "street" or "amenity") ||
                street.Length == 0 ||
                (NormalizeStreet(ReadString(result, "street")) != street &&
                 NormalizeStreet(ReadString(result, "name")) != street &&
                 NormalizeStreet(ReadString(result, "address_line1")) != street) ||
                candidatePostalCode.Length != 8 || candidatePostalCode[..3] != postalCode[..3] ||
                string.IsNullOrWhiteSpace(ReadString(result, "city")) ||
                string.IsNullOrWhiteSpace(ReadString(result, "state")) ||
                !result.TryGetProperty("rank", out var rank) || rank.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var confidence = ReadConfidence(rank, "confidence");
            var streetConfidence = ReadConfidence(rank, "confidence_street_level");
            // Alguns resultados têm confiança geral zero, mas reconhecem a rua e o CEP exato.
            // Nesse caso a posição é aceita somente como aproximação na via informada.
            var strongLocalMatch = candidatePostalCode == postalCode && streetConfidence >= 0.8;
            if (confidence < 0 || (!strongLocalMatch && (confidence < 0.25 ||
                (confidence < 0.7 && (streetConfidence < 0.5 ||
                                      ReadConfidence(rank, "confidence_city_level") < 0.5)))))
            {
                continue;
            }

            var postalMatch = candidatePostalCode == postalCode ? 2 : candidatePostalCode[..5] == postalCode[..5] ? 1 : 0;
            candidates.Add((new Point(lon, lat) { SRID = 4326 },
                number.Length > 0 && NormalizeName(ReadString(result, "housenumber")) == number,
                type == "building", postalMatch, confidence));
        }

        if (!hasValidCoordinates)
        {
            throw new GeocodingException("O serviço de localização retornou coordenadas inválidas.", true);
        }

        return candidates.OrderByDescending(candidate => candidate.PostalMatch)
            .ThenByDescending(candidate => candidate.ExactNumber)
            .ThenByDescending(candidate => candidate.Building)
            .ThenByDescending(candidate => candidate.Confidence)
            .Select(candidate => candidate.Point).FirstOrDefault();
    }

    private static string ReadString(JsonElement value, string name)
    {
        return value.TryGetProperty(name, out var property) && property.ValueKind == JsonValueKind.String
            ? property.GetString() ?? string.Empty : string.Empty;
    }

    private static double ReadConfidence(JsonElement rank, string name)
    {
        return rank.TryGetProperty(name, out var property) && property.ValueKind == JsonValueKind.Number &&
            property.TryGetDouble(out var score) && double.IsFinite(score) && score >= 0 && score <= 1
            ? score : -1;
    }

    private static bool TryCoordinate(JsonElement value, string name, double min, double max, out double coordinate)
    {
        coordinate = 0;
        return value.TryGetProperty(name, out var property) && property.ValueKind == JsonValueKind.Number &&
            property.TryGetDouble(out coordinate) && double.IsFinite(coordinate) && coordinate >= min && coordinate <= max;
    }

    private static string NormalizePostalCode(string? value)
    {
        var code = (value ?? string.Empty).Trim().Replace("-", string.Empty).Replace(" ", string.Empty);
        return code.All(char.IsAsciiDigit) ? code : string.Empty;
    }

    private static string NormalizeName(string? value)
    {
        var text = (value ?? string.Empty).Normalize(NormalizationForm.FormD);
        var normalized = new StringBuilder();
        foreach (var character in text)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }
            normalized.Append(char.IsLetterOrDigit(character) ? char.ToUpperInvariant(character) : ' ');
        }
        return string.Join(" ", normalized.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private static string NormalizeStreet(string value)
    {
        var parts = NormalizeName(value).Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();
        if (parts.Count == 0)
        {
            return string.Empty;
        }
        if (parts[0] is "R" or "RUA" or "AV" or "AVENIDA" or "TV" or "TRAVESSA" or
            "EST" or "ESTRADA" or "ROD" or "RODOVIA" or "PCA" or "PRACA" or "LGO" or "LARGO")
        {
            parts.RemoveAt(0);
        }
        return string.Join(" ", parts.Where(part => part is not ("DE" or "DA" or "DO" or "DAS" or "DOS"))
            .Select(part => part switch
            {
                "MAL" => "MARECHAL",
                "GEN" => "GENERAL",
                "DR" => "DOUTOR",
                "PROF" => "PROFESSOR",
                "PRES" => "PRESIDENTE",
                _ => part
            }));
    }
}
