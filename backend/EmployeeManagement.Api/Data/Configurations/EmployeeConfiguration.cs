using EmployeeManagement.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EmployeeManagement.Api.Data.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.FullName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Email)
            .IsRequired()
            .HasMaxLength(150);

        // Enforce unique constraint at SQL Server database level
        builder.HasIndex(e => e.Email)
            .IsUnique()
            .HasDatabaseName("IX_Employees_Email_Unique");

        builder.Property(e => e.Department)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.Salary)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(e => e.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(e => e.CreatedAtUtc)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");
    }
}
