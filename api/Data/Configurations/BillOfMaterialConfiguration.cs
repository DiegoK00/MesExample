using Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Data.Configurations;

public class BillOfMaterialConfiguration : IEntityTypeConfiguration<BillOfMaterial>
{
    public void Configure(EntityTypeBuilder<BillOfMaterial> builder)
    {
        builder.ToTable("BillOfMaterials", t =>
            t.HasCheckConstraint("CHK_QuantityType", "QuantityType IN ('PHYSICAL', 'PERCENTAGE')"));

        // Chiave primaria composta
        builder.HasKey(bom => new { bom.ParentArticleId, bom.ComponentArticleId });

        // Proprietà
        builder.Property(bom => bom.Quantity).HasPrecision(18, 4);
        builder.Property(bom => bom.QuantityType).HasMaxLength(20).IsRequired();
        builder.Property(bom => bom.ScrapPercentage).HasPrecision(5, 2).HasDefaultValue(0);
        builder.Property(bom => bom.ScrapFactor).HasPrecision(5, 4).HasDefaultValue(0);
        builder.Property(bom => bom.FixedScrap).HasPrecision(18, 4).HasDefaultValue(0);

        // Foreign Keys con Restrict (per evitare cascate indesiderate)
        builder.HasOne(bom => bom.ParentArticle)
            .WithMany(a => a.AsParentArticle)
            .HasForeignKey(bom => bom.ParentArticleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(bom => bom.ComponentArticle)
            .WithMany(a => a.AsComponentArticle)
            .HasForeignKey(bom => bom.ComponentArticleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(bom => bom.UM)
            .WithMany(um => um.BillOfMaterials)
            .HasForeignKey(bom => bom.UmId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
