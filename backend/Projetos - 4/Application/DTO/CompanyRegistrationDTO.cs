namespace Projetos___4.Application.DTO;

public class CompanyRegistrationDTO
{
    public string CNPJ { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public string TradeName { get; set; } = string.Empty;
    public int RegistrationStatus { get; set; }
    public string StatusDescription { get; set; } = string.Empty;
    public DateTime CheckedAt { get; set; }
    public string Street { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string Complement { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string CEP { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
}
