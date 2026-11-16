using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Configurations;

public class ProgrammingInteractionConfiguration : IEntityTypeConfiguration<ProgrammingInteraction>
{
    public void Configure(EntityTypeBuilder<ProgrammingInteraction> builder)
    {
        builder.ToTable("ProgrammingInteractions", table =>
            table.HasCheckConstraint("CK_ProgrammingInteractions_Type", "\"Type\" BETWEEN 0 AND 3"));
        builder.HasKey(interaction => interaction.Id);
        builder.HasIndex(interaction => interaction.EventId).IsUnique();
        builder.HasIndex(interaction => new { interaction.ProgrammingId, interaction.CreatedAt });
        builder.HasOne(interaction => interaction.Programming).WithMany()
            .HasForeignKey(interaction => interaction.ProgrammingId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(interaction => interaction.User).WithMany()
            .HasForeignKey(interaction => interaction.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
