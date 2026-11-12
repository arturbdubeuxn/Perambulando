using Projetos___4.Application.DTO.TravelChat;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model.TravelChat;

namespace Projetos___4.Application.Mapping;

public class TravelChatMapping : ITravelChatMapping
{
    private readonly IProgrammingMapping _programmingMapping;
    private readonly IHostMapping _hostMapping;

    public TravelChatMapping(IProgrammingMapping programmingMapping, IHostMapping hostMapping)
    {
        _programmingMapping = programmingMapping;
        _hostMapping = hostMapping;
    }

    public TravelChatMessage ToModel(TravelChatMessageDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        return new TravelChatMessage
        {
            Text = dto.Text
        };
    }

    public TravelChatResponseDTO ToDTO(TravelChatResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);

        return new TravelChatResponseDTO
        {
            Programmings = response.Programmings.Select(_programmingMapping.ToDTO).ToList(),
            Hosts = response.Hosts.Select(_hostMapping.ToDTO).ToList()
        };
    }
}
