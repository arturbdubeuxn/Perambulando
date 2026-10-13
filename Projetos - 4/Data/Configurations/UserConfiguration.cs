using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Projetos___4._3___Domain.Model;

namespace Projetos___4._4___Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.Property(user => user.UserName).HasMaxLength(256);
        builder.Property(user => user.NormalizedUserName).HasMaxLength(256);
        builder.Property(user => user.Email).HasMaxLength(256);
        builder.Property(user => user.NormalizedEmail).HasMaxLength(256);
        builder.Ignore(user => user.PhoneNumber);
        builder.Ignore(user => user.PhoneNumberConfirmed);
        builder.Ignore(user => user.AccessFailedCount);
        builder.Ignore(user => user.LockoutEnabled);
        builder.Ignore(user => user.LockoutEnd);
        builder.Ignore(user => user.TwoFactorEnabled);
        builder.Ignore(user => user.SecurityStamp);
        builder.Ignore(user => user.ConcurrencyStamp);
        builder.Ignore(user => user.EmailConfirmed);
    }
}
