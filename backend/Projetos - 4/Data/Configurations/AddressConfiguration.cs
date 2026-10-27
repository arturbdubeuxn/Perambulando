using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Configurations;

public class AddressConfiguration : IEntityTypeConfiguration<Address>
{
    public void Configure(EntityTypeBuilder<Address> builder)
    {
        builder.ToTable("Addresses");
        builder.Property(address => address.City).HasMaxLength(150).IsRequired();
        builder.Property(address => address.Street).HasMaxLength(300).IsRequired();
        builder.Property(address => address.Number).HasMaxLength(20).IsRequired();
        builder.Property(address => address.Complement).HasMaxLength(200).IsRequired();
        builder.Property(address => address.Neighborhood).HasMaxLength(150).IsRequired();
        builder.Property(address => address.CEP).HasMaxLength(8).IsRequired();
        builder.Property(address => address.Location).HasColumnType("geography(Point,4326)");
        builder.HasIndex(address => address.Location).HasMethod("gist");
    }
}
