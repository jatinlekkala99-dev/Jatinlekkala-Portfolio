using EmployeeManagement.Api.Data;
using EmployeeManagement.Api.DTOs;
using EmployeeManagement.Api.Exceptions;
using EmployeeManagement.Api.Models;
using EmployeeManagement.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EmployeeManagement.Tests;

public class EmployeeServiceTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateEmployeeAsync_ValidRequest_CreatesAndReturnsEmployee()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var loggerMock = new Mock<ILogger<EmployeeService>>();
        var service = new EmployeeService(context, loggerMock.Object);

        var request = new CreateEmployeeRequest
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Department = "Engineering",
            Salary = 95000m,
            IsActive = true
        };

        // Act
        var result = await service.CreateEmployeeAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("John Doe", result.FullName);
        Assert.Equal("john.doe@example.com", result.Email);
        Assert.Equal("Engineering", result.Department);
        Assert.Equal(95000m, result.Salary);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task CreateEmployeeAsync_DuplicateEmail_ThrowsDuplicateEmailException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var loggerMock = new Mock<ILogger<EmployeeService>>();
        var service = new EmployeeService(context, loggerMock.Object);

        context.Employees.Add(new Employee
        {
            FullName = "Existing User",
            Email = "existing@example.com",
            Department = "HR",
            Salary = 60000m,
            IsActive = true
        });
        await context.SaveChangesAsync();

        var request = new CreateEmployeeRequest
        {
            FullName = "New User",
            Email = "EXISTING@example.com", // Case-insensitive duplicate
            Department = "Marketing",
            Salary = 70000m
        };

        // Act & Assert
        await Assert.ThrowsAsync<DuplicateEmailException>(() => service.CreateEmployeeAsync(request));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-500)]
    public async Task CreateEmployeeAsync_InvalidSalary_ThrowsArgumentException(decimal invalidSalary)
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var loggerMock = new Mock<ILogger<EmployeeService>>();
        var service = new EmployeeService(context, loggerMock.Object);

        var request = new CreateEmployeeRequest
        {
            FullName = "Jane Doe",
            Email = "jane@example.com",
            Department = "Finance",
            Salary = invalidSalary
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateEmployeeAsync(request));
    }

    [Fact]
    public async Task GetEmployeeByIdAsync_ExistingId_ReturnsEmployee()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var loggerMock = new Mock<ILogger<EmployeeService>>();
        var service = new EmployeeService(context, loggerMock.Object);

        var emp = new Employee
        {
            FullName = "Alice Smith",
            Email = "alice@example.com",
            Department = "Operations",
            Salary = 80000m,
            IsActive = true
        };
        context.Employees.Add(emp);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetEmployeeByIdAsync(emp.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(emp.Id, result.Id);
        Assert.Equal("Alice Smith", result.FullName);
    }

    [Fact]
    public async Task GetEmployeeByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var loggerMock = new Mock<ILogger<EmployeeService>>();
        var service = new EmployeeService(context, loggerMock.Object);

        // Act
        var result = await service.GetEmployeeByIdAsync(9999);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetAllEmployeesAsync_FiltersBySearchAndDepartment()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var loggerMock = new Mock<ILogger<EmployeeService>>();
        var service = new EmployeeService(context, loggerMock.Object);

        context.Employees.AddRange(
            new Employee { FullName = "Sarah Connor", Email = "sarah@cyberdyne.com", Department = "Security", Salary = 90000m, IsActive = true },
            new Employee { FullName = "John Connor", Email = "john@resistance.org", Department = "Leadership", Salary = 120000m, IsActive = true },
            new Employee { FullName = "Kyle Reese", Email = "kyle@resistance.org", Department = "Security", Salary = 75000m, IsActive = false }
        );
        await context.SaveChangesAsync();

        // Act - Search by email/name
        var searchResults = (await service.GetAllEmployeesAsync(search: "Connor")).ToList();

        // Act - Filter by Department and Active status
        var deptResults = (await service.GetAllEmployeesAsync(department: "Security", isActive: true)).ToList();

        // Assert
        Assert.Equal(2, searchResults.Count);
        Assert.Single(deptResults);
        Assert.Equal("Sarah Connor", deptResults[0].FullName);
    }

    [Fact]
    public async Task UpdateEmployeeAsync_ValidRequest_UpdatesAndReturnsEmployee()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var loggerMock = new Mock<ILogger<EmployeeService>>();
        var service = new EmployeeService(context, loggerMock.Object);

        var emp = new Employee
        {
            FullName = "Bob Brown",
            Email = "bob@example.com",
            Department = "Support",
            Salary = 50000m,
            IsActive = true
        };
        context.Employees.Add(emp);
        await context.SaveChangesAsync();

        var updateRequest = new UpdateEmployeeRequest
        {
            FullName = "Robert Brown",
            Email = "robert.brown@example.com",
            Department = "Customer Success",
            Salary = 65000m,
            IsActive = false
        };

        // Act
        var result = await service.UpdateEmployeeAsync(emp.Id, updateRequest);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Robert Brown", result.FullName);
        Assert.Equal("robert.brown@example.com", result.Email);
        Assert.Equal("Customer Success", result.Department);
        Assert.Equal(65000m, result.Salary);
        Assert.False(result.IsActive);
    }

    [Fact]
    public async Task UpdateEmployeeAsync_EmailConflictWithAnotherEmployee_ThrowsDuplicateEmailException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var loggerMock = new Mock<ILogger<EmployeeService>>();
        var service = new EmployeeService(context, loggerMock.Object);

        var emp1 = new Employee { FullName = "User One", Email = "user1@example.com", Department = "IT", Salary = 70000m };
        var emp2 = new Employee { FullName = "User Two", Email = "user2@example.com", Department = "IT", Salary = 70000m };
        context.Employees.AddRange(emp1, emp2);
        await context.SaveChangesAsync();

        var updateRequest = new UpdateEmployeeRequest
        {
            FullName = "User Two Renamed",
            Email = "user1@example.com", // Conflict with User 1
            Department = "IT",
            Salary = 75000m,
            IsActive = true
        };

        // Act & Assert
        await Assert.ThrowsAsync<DuplicateEmailException>(() => service.UpdateEmployeeAsync(emp2.Id, updateRequest));
    }

    [Fact]
    public async Task DeleteEmployeeAsync_ExistingId_DeletesEmployee()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var loggerMock = new Mock<ILogger<EmployeeService>>();
        var service = new EmployeeService(context, loggerMock.Object);

        var emp = new Employee { FullName = "To Delete", Email = "delete@example.com", Department = "HR", Salary = 40000m };
        context.Employees.Add(emp);
        await context.SaveChangesAsync();

        // Act
        var deleted = await service.DeleteEmployeeAsync(emp.Id);

        // Assert
        Assert.True(deleted);
        var found = await context.Employees.FindAsync(emp.Id);
        Assert.Null(found);
    }

    [Fact]
    public async Task DeleteEmployeeAsync_NonExistingId_ThrowsNotFoundException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var loggerMock = new Mock<ILogger<EmployeeService>>();
        var service = new EmployeeService(context, loggerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.DeleteEmployeeAsync(999));
    }
}
