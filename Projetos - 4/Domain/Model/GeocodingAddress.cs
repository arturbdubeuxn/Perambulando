namespace Projetos___4.Domain.Model;

// Complemento (sala, bloco etc.) não altera a posição geográfica do endereço.
public sealed record GeocodingAddress(string Street, string Number, string? Neighborhood, string PostalCode);
