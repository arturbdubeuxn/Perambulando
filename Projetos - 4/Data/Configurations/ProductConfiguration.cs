using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4._3___Domain.Model;

namespace Projetos___4._4___Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.Property(product => product.Name).HasMaxLength(150).IsRequired();

        builder.Property(product => product.Description).HasMaxLength(2000).IsRequired();

        builder.Property(product => product.ImageUrl).HasMaxLength(2048).IsRequired();
    }
}
