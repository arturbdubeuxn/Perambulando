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
        var hosts = from host in Db.Hosts.AsNoTracking()
                    where host.IsActive && (host.Typeofhost == Hosts.TypeofHost.Gastronomy || host.Typeofhost == Hosts.TypeofHost.Business) && (!excludedHostId.HasValue || host.Id != excludedHostId.Value)
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

