using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4._3___Domain.Model;

namespace Projetos___4._4___Data.Configurations;

public class HostConfiguration : IEntityTypeConfiguration<Hosts>
{
    public void Configure(EntityTypeBuilder<Hosts> builder)
    {
        builder.ToTable("Hosts");
        builder.Property(host => host.Name).HasMaxLength(150).IsRequired();

        builder.Property(host => host.Description).HasMaxLength(2000).IsRequired();

        builder.Property(host => host.CNPJ).HasMaxLength(18).IsRequired();

        builder.Property(host => host.CEP).HasMaxLength(9).IsRequired();

        builder.Property(host => host.Phone).HasMaxLength(30).IsRequired();

        builder.Property(host => host.Address).HasMaxLength(300).IsRequired();

        builder.Property(host => host.Neighborhood).HasMaxLength(150).IsRequired();

        builder.Property(host => host.LogoUrl).HasMaxLength(2048).IsRequired();

        builder.Property(host => host.InstagranUrl).HasMaxLength(2048).IsRequired();
    }
}
