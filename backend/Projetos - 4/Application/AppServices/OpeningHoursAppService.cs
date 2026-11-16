using Projetos___4.Application.DTO.OpeningDays;
using Projetos___4.Application.Interfaces;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Application.Validations.Interfaces;
using Projetos___4.Domain.Interfaces.Service;

namespace Projetos___4.Application.AppServices;

public class OpeningHoursAppService : IOpeningHoursAppService
{
    private readonly IOpeningHoursService _openingHoursService;
    private readonly IOpeningHoursMapping _openingHoursMapping;
    private readonly IValidation<OpeningWeekDTO> _openingWeekValidation;

    public OpeningHoursAppService(IOpeningHoursService openingHoursService, IOpeningHoursMapping openingHoursMapping,
        IValidation<OpeningWeekDTO> openingWeekValidation)
    {
        _openingHoursService = openingHoursService;
        _openingHoursMapping = openingHoursMapping;
        _openingWeekValidation = openingWeekValidation;
    }

    public async Task<OpeningWeekResponseDTO> GetByHostIdAsync(int hostId, string userId)
    {
        var days = await _openingHoursService.GetByHostIdAsync(hostId, userId);
        return _openingHoursMapping.ToDTO(hostId, days);
    }

    public async Task<OpeningWeekResponseDTO> EditAsync(OpeningWeekDTO dto, int hostId, string userId)
    {
        _openingWeekValidation.Validate(dto, DateTime.UtcNow);
        var days = _openingHoursMapping.ToModel(dto, hostId);
        var updated = await _openingHoursService.EditAsync(days, hostId, userId);
        return _openingHoursMapping.ToDTO(hostId, updated);
    }
}
