using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Name).IsRequired().HasMaxLength(50);
        builder.Property(r => r.Description).HasMaxLength(200);

        builder.HasIndex(r => r.Name).IsUnique();

        builder.HasData(
            new Role { Id = 1, Name = "SuperAdmin", Description = "Full system access" },
            new Role { Id = 2, Name = "Admin", Description = "Administrative access" },
            new Role { Id = 3, Name = "User", Description = "Standard user access" }
        );
    }
}
