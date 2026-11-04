using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4.Domain.Model;

namespace Projetos___4.Data.Configurations;

public class HostOpeningPeriodConfiguration : IEntityTypeConfiguration<HostOpeningPeriod>
{
    public void Configure(EntityTypeBuilder<HostOpeningPeriod> builder)
    {
        builder.ToTable("HostOpeningPeriods");
        builder.HasKey(period => period.Id);
        builder.Property(period => period.OpeningTime).HasColumnType("time without time zone").IsRequired();
        builder.Property(period => period.ClosingTime).HasColumnType("time without time zone").IsRequired();
        builder.Property(period => period.ClosesNextDay).IsRequired();
        builder.HasOne(period => period.HostOpeningDay).WithMany(day => day.Periods)
            .HasForeignKey(period => period.HostOpeningDayId).OnDelete(DeleteBehavior.Cascade);
    }
}
