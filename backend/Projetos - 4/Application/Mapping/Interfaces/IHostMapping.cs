using Projetos___4.Application.DTO;
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
