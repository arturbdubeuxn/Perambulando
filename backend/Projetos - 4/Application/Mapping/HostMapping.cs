using Projetos___4.Application.DTO;
using Projetos___4.Domain.Model;
using Projetos___4.Application.Mapping.Interfaces;

namespace Projetos___4.Application.Mapping;

public class HostMapping : IHostMapping
{
    private readonly IAddressMapping _addressMapping;
    private readonly IProgrammingMapping _programmingMapping;

    public HostMapping(IAddressMapping addressMapping, IProgrammingMapping programmingMapping)
    {
        _addressMapping = addressMapping;
        _programmingMapping = programmingMapping;
    }

    public Hosts ToModel(HostDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        var host = new Hosts
        {
            Typeofhost = dto.Typeofhost!.Value,
            CNPJ = dto.CNPJ,
            LogoUrl = dto.LogoUrl,
            InstagranUrl = dto.InstagranUrl,
            AddressId = dto.AddressId ?? 0,
            Phone = dto.Phone,
            Name = dto.Name,
            Description = dto.Description
        };
        if (dto.Address != null)
        {
            host.Address = _addressMapping.ToModel(dto.Address);
        }
        return host;
    }

    public HostResponseDTO ToDTO(Hosts host)
    {
        ArgumentNullException.ThrowIfNull(host);
        return new HostResponseDTO
        {
            Id = host.Id,
            Typeofhost = host.Typeofhost,
            CNPJ = host.CNPJ,
            LogoUrl = host.LogoUrl,
            InstagranUrl = host.InstagranUrl,
            Phone = host.Phone,
            Name = host.Name,
            Description = host.Description,
            AddressId = host.AddressId,
            Address = _addressMapping.ToDTO(host.Address),
            IsActive = host.IsActive,
            CreatedAt = host.CreatedAt,
            UpdatedAt = host.UpdatedAt
        };
    }

    public HostCreatedDTO ToCreatedDTO(Hosts host)
    {
        ArgumentNullException.ThrowIfNull(host);
        return new HostCreatedDTO { Id = host.Id, AddressId = host.AddressId, Name = host.Name };
    }

    public HostDetailsDTO ToDetailsDTO(Hosts host, IEnumerable<Programming> programmings)
    {
        ArgumentNullException.ThrowIfNull(host);
        ArgumentNullException.ThrowIfNull(programmings);
        return new HostDetailsDTO
        {
            Id = host.Id,
            Name = host.Name,
            Description = host.Description,
            Typeofhost = host.Typeofhost,
            CNPJ = host.CNPJ,
            LogoUrl = host.LogoUrl,
            InstagranUrl = host.InstagranUrl,
            AddressId = host.AddressId,
            Address = _addressMapping.ToDTO(host.Address),
            Phone = host.Phone,
            Programmings = programmings.Select(programming => _programmingMapping.ToDetailsDTO(programming, host)).ToList()
        };
    }

    public CompanyRegistrationDTO ToCompanyDTO(CompanyRegistration company)
    {
        ArgumentNullException.ThrowIfNull(company);
        return new CompanyRegistrationDTO
        {
            CNPJ = company.CNPJ,
            LegalName = company.LegalName,
            TradeName = company.TradeName,
            RegistrationStatus = company.RegistrationStatus,
            StatusDescription = company.StatusDescription,
            CheckedAt = company.CheckedAt,
            Street = company.Street,
            Number = company.Number,
            Complement = company.Complement,
            Neighborhood = company.Neighborhood,
            CEP = company.CEP,
            City = company.City,
            State = company.State
        };
    }
}
