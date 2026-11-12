using Projetos___4.Application.DTO.Company;
using Projetos___4.Application.DTO.Host;
using Projetos___4.Domain.Model;

namespace Projetos___4.Application.Mapping.Interfaces;

public interface IHostMapping
{
    Hosts ToModel(HostDTO dto);
    HostResponseDTO ToDTO(Hosts host);
    HostCreatedDTO ToCreatedDTO(Hosts host);
    HostDetailsDTO ToDetailsDTO(Hosts host, IEnumerable<Programming> programmings);
    CompanyRegistrationDTO ToCompanyDTO(CompanyRegistration company);
}
