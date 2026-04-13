using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;

public class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        builder.ToTable("Articles");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Code).IsRequired().HasMaxLength(50);
        builder.Property(a => a.Name).IsRequired().HasMaxLength(200);
        builder.Property(a => a.Description).HasMaxLength(1000);
        builder.Property(a => a.Price).IsRequired().HasColumnType("decimal(18,2)");
        builder.Property(a => a.Measures).HasMaxLength(100);
        builder.Property(a => a.Composition).HasMaxLength(500);
        builder.Property(a => a.CreatedAt).IsRequired();

        builder.HasIndex(a => a.Code).IsUnique();

        builder.HasOne(a => a.Category)
            .WithMany(c => c.Articles)
            .HasForeignKey(a => a.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.UM)
            .WithMany(m => m.ArticlesUM)
            .HasForeignKey(a => a.UMId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.UM2)
            .WithMany(m => m.ArticlesUM2)
            .HasForeignKey(a => a.UM2Id)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.CreatedByUser)
            .WithMany()
            .HasForeignKey(a => a.CreatedFrom)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.DeletedByUser)
            .WithMany()
            .HasForeignKey(a => a.DeletedFrom)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
