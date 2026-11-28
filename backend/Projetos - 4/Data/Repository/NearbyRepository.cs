using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Projetos___4.Domain.Interfaces.Repository;
using Projetos___4.Domain.Model;
namespace Projetos___4.Data.Repository;
public class NearbyRepository : INearbyRepository
{
    private readonly Context.Context Db;
    public NearbyRepository(Context.Context db) { Db = db; }
    public async Task<List<NearbyItem>> GetNearbyAsync(Point origin, int minMeters, int maxMeters, NearbyFilter filter,
        int? excludedHostId = null, int? excludedProgrammingId = null)
    {
        var now = DateTime.UtcNow;
        var categoryIds = filter.CategoriesId ?? new List<int>();
        var selectedCategories = Db.Categories.Where(category => category.IsActive && categoryIds.Contains(category.Id));
        var hosts = from host in Db.Hosts.AsNoTracking()
                    where host.IsActive && (host.Typeofhost == Hosts.TypeofHost.Gastronomy || host.Typeofhost == Hosts.TypeofHost.Business)
                        && (!excludedHostId.HasValue || host.Id != excludedHostId.Value)
                        && ((categoryIds.Count == 0
                             && !Db.Programmings.Any(programming => programming.IsActive && programming.EndDate > now && programming.AddressId == host.AddressId))
                            || (filter.IncludePreferredHosts && selectedCategories.Any(category =>
                                (host.Typeofhost == Hosts.TypeofHost.Gastronomy && category.Name.Trim().ToLower() == "gastronomia")
                                || (host.Typeofhost == Hosts.TypeofHost.Business
                                    && (category.Name.Trim().ToLower() == "comércio" || category.Name.Trim().ToLower() == "comercio")))))
                        && host.Address.Location != null && host.Address.Location.IsWithinDistance(origin, maxMeters)
                        && (minMeters == 0 || host.Address.Location.Distance(origin) > minMeters)
                    select new NearbyItem
                    {
                        Id = host.Id, TargetType = 0, Name = host.Name, ImageUrl = host.LogoUrl,
                        Description = host.Description,
                        Address = host.Address.Street + ", " + host.Address.Number + " - " + host.Address.Neighborhood + ", " + host.Address.City,
                        DistanceMeters = host.Address.Location!.Distance(origin),
                        Location = host.Address.Location
                    };
        var programmings = from programming in Db.Programmings.AsNoTracking()
                           where programming.IsActive && programming.Host.IsActive && programming.EndDate > now
                               && (categoryIds.Count == 0 || Db.ProgrammingXCategories.Any(link => link.ProgrammingId == programming.Id && link.Category.IsActive && categoryIds.Contains(link.CategoryId)))
                               && (!excludedProgrammingId.HasValue || programming.Id != excludedProgrammingId.Value)
                               && programming.Address.Location != null && programming.Address.Location.IsWithinDistance(origin, maxMeters)
                               && (minMeters == 0 || programming.Address.Location.Distance(origin) > minMeters)
                           select new NearbyItem
                           {
                               Id = programming.Id, TargetType = 1, Name = programming.Name, ImageUrl = programming.ImageUrl,
                               Description = programming.Description,
                               Address = programming.Address.Street + ", " + programming.Address.Number + " - " + programming.Address.Neighborhood + ", " + programming.Address.City,
                               DistanceMeters = programming.Address.Location!.Distance(origin),
                               Location = programming.Address.Location
                           };
        var items = await hosts.Concat(programmings)
            .OrderBy(item => item.DistanceMeters).ThenBy(item => item.TargetType).ThenBy(item => item.Id)
            .Skip(filter.Skip).Take(11).ToListAsync();
        foreach (var item in items)
        {
            item.Latitude = item.Location!.Y;
            item.Longitude = item.Location.X;
        }
        return items;
    }

    public async Task<List<NearbyItem>> GetNearestProgrammingsAsync(Point origin, int excludedProgrammingId, int skip, int take)
    {
        var now = DateTime.UtcNow;
        var items = await Db.Programmings.AsNoTracking()
            .Where(programming => programming.IsActive && programming.Host.IsActive && programming.EndDate > now
                && programming.Id != excludedProgrammingId && programming.Address.Location != null)
            .Select(programming => new NearbyItem
            {
                Id = programming.Id,
                TargetType = 1,
                Name = programming.Name,
                Description = programming.Description,
                Address = programming.Address.Street + ", " + programming.Address.Number + " - " + programming.Address.Neighborhood + ", " + programming.Address.City,
                ImageUrl = programming.ImageUrl,
                DistanceMeters = programming.Address.Location!.Distance(origin),
                Location = programming.Address.Location
            })
            .OrderBy(item => item.DistanceMeters)
            .ThenBy(item => item.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        foreach (var item in items)
        {
            item.Latitude = item.Location!.Y;
            item.Longitude = item.Location.X;
        }
        return items;
    }
}

