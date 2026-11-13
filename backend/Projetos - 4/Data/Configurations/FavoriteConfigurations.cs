using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Configurations
{
    public class FavoriteConfigurations : IEntityTypeConfiguration<Favorite>
    {
        public void Configure(EntityTypeBuilder<Favorite> builder)
        {
            builder.ToTable("Favorites");
            builder.HasKey(f => f.Id);
            builder.Property(f => f.UserId).IsRequired();
            builder.HasIndex(f => new { f.UserId, f.ProgrammingId }).IsUnique();
            builder.HasOne(f => f.User).WithMany().HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(f => f.Programming).WithMany().HasForeignKey(f => f.ProgrammingId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
