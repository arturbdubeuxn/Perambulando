using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Configurations;

public class HostOpeningDayConfiguration : IEntityTypeConfiguration<HostOpeningDay>
{
    public void Configure(EntityTypeBuilder<HostOpeningDay> builder)
    {
        builder.ToTable("HostOpeningDays");
        builder.HasKey(day => day.Id);
        builder.Property(day => day.DayOfWeek).HasConversion<int>().IsRequired();
        builder.Property(day => day.IsClosed).IsRequired();
        builder.HasIndex(day => new { day.HostId, day.DayOfWeek }).IsUnique();
        builder.HasOne(day => day.Host).WithMany(host => host.OpeningDays).HasForeignKey(day => day.HostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
