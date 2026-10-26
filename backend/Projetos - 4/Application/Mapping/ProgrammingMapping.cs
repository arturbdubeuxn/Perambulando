using Projetos___4.Application.DTO;
using Projetos___4.Application.Mapping.Interfaces;
using Projetos___4.Domain.Model;
namespace Projetos___4.Application.Mapping;

public class ProgrammingMapping : IProgrammingMapping
{
    private readonly IAddressMapping _addressMapping;
    private readonly ICategoryMapping _categoryMapping;

    public ProgrammingMapping(IAddressMapping addressMapping, ICategoryMapping categoryMapping)
    {
        _addressMapping = addressMapping;
        _categoryMapping = categoryMapping;
    }

    public  Programming ToModel(ProgrammingDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var programming = new Programming
        {
            Name = dto.Name,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsFree = dto.IsFree,
            AddressId = dto.AddressId ?? 0,
            ImageUrl = dto.ImageUrl,
            TicketUrl = dto.TicketUrl,
            InstagranUrl = dto.InstagranUrl,
            MinPrice = dto.MinPrice,
            MaxPrice = dto.MaxPrice
        };

        if (dto.Address != null)
        {
            programming.Address = _addressMapping.ToModel(dto.Address);
        }

        return programming;
    }

    public ProgrammingResponseDTO ToDTO(Programming programming)
    {
        ArgumentNullException.ThrowIfNull(programming);

        return new ProgrammingResponseDTO
        {
            Id = programming.Id,
            Name = programming.Name,
            IsActive = programming.IsActive,
            Description = programming.Description,
            StartDate = programming.StartDate,
            EndDate = programming.EndDate,
            IsFree = programming.IsFree,
            ImageUrl = programming.ImageUrl,
            TicketUrl = programming.TicketUrl,
            InstagranUrl = programming.InstagranUrl,
            HostId = programming.HostId,
            AddressId = programming.AddressId,
            CreatedDate = programming.CreatedDate,
            UpdateDate = programming.UpdateDate,
            MinPrice = programming.MinPrice,
            MaxPrice = programming.MaxPrice,
            Address = _addressMapping.ToDTO(programming.Address)
        };
    }

    public ProgrammingDetailsDTO ToDetailsDTO(Programming programming, Hosts host, IEnumerable<Category>? categories = null)
    {
        ArgumentNullException.ThrowIfNull(programming);
        ArgumentNullException.ThrowIfNull(host);
        return new ProgrammingDetailsDTO
        {
            Id = programming.Id,
            HostId = programming.HostId,
            Name = programming.Name,
            Description = programming.Description,
            StartDate = programming.StartDate,
            EndDate = programming.EndDate,
            IsFree = programming.IsFree,
            AddressId = programming.AddressId,
            Address = _addressMapping.ToDTO(programming.Address),
            ImageUrl = programming.ImageUrl,
            TicketUrl = programming.TicketUrl,
            InstagranUrl = programming.InstagranUrl,
            HostName = host.Name,
            HostLogoUrl = host.LogoUrl,
            CreatedDate = programming.CreatedDate,
            UpdateDate = programming.UpdateDate,
            MinPrice = programming.MinPrice,
            MaxPrice = programming.MaxPrice,
            Categories = categories?.Select(_categoryMapping.ToDTO).ToList()
        };
    }
}
