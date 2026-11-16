using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4.Domain.Model;
namespace Projetos___4.Data.Configurations;
public class HostsPhotosConfiguration : IEntityTypeConfiguration<HostsPhotos>
{
    public void Configure(EntityTypeBuilder<HostsPhotos> builder)
    {
        builder.ToTable("HostsPhotos");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.PhotoUrl).IsRequired().HasMaxLength(2048);
        builder.HasIndex(p => new { p.HostId, p.IsActive });
        builder.HasOne<Hosts>().WithMany().HasForeignKey(p => p.HostId).OnDelete(DeleteBehavior.Cascade);
    }
}
