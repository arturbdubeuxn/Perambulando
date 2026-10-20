using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Configurations
{
    public class ProgrammingConfigurations : IEntityTypeConfiguration<Programming>
    {
        public void Configure(EntityTypeBuilder<Programming> builder)
        {
            builder.Property(programming => programming.AddressNumber).HasMaxLength(20).IsRequired();
            builder.Property(programming => programming.AddressComplement).HasMaxLength(200);
            builder.Property(programming => programming.Location).HasColumnType("geography(Point,4326)");
            builder.HasIndex(programming => programming.Location).HasMethod("gist");
        }
    }
}
