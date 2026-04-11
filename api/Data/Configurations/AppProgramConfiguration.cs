using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;

public class AppProgramConfiguration : IEntityTypeConfiguration<AppProgram>
{
    public void Configure(EntityTypeBuilder<AppProgram> builder)
    {
        builder.ToTable("Programs");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Code).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Description).HasMaxLength(500);
        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasIndex(p => p.Code).IsUnique();
    }
}
