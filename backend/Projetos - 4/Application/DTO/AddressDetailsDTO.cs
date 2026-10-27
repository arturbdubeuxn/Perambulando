namespace Projetos___4.Application.DTO;

public class AddressDetailsDTO
{
    public int Id { get; set; }
    public string City { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string Complement { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string CEP { get; set; } = string.Empty;
}
