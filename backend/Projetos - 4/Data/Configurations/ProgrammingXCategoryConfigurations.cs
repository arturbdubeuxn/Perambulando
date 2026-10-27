using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Configurations;

public class ProgrammingXCategoryConfigurations : IEntityTypeConfiguration<ProgrammingXCategory>
{
    public void Configure(EntityTypeBuilder<ProgrammingXCategory> builder)
    {
        builder.ToTable("ProgrammingXCategories");
        builder.HasOne(link => link.Programming)
            .WithMany(programming => programming.ProgrammingXCategories)
            .HasForeignKey(link => link.ProgrammingId);
        builder.HasIndex(link => new { link.ProgrammingId, link.CategoryId }).IsUnique();
    }
}
