using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;

public class UserProgramConfiguration : IEntityTypeConfiguration<UserProgram>
{
    public void Configure(EntityTypeBuilder<UserProgram> builder)
    {
        builder.HasKey(up => new { up.UserId, up.ProgramId });

        builder.Property(up => up.GrantedAt).IsRequired();

        builder.HasOne(up => up.User)
            .WithMany(u => u.UserPrograms)
            .HasForeignKey(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(up => up.Program)
            .WithMany(p => p.UserPrograms)
            .HasForeignKey(up => up.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(up => up.GrantedBy)
            .WithMany()
            .HasForeignKey(up => up.GrantedByUserId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
