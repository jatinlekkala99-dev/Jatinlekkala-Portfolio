using EmployeeManagement.Api.Controllers;
using EmployeeManagement.Api.DTOs;
using EmployeeManagement.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EmployeeManagement.Tests;

public class EmployeesControllerTests
{
    private readonly Mock<IEmployeeService> _serviceMock = new();
    private readonly Mock<ILogger<EmployeesController>> _loggerMock = new();

    [Fact]
    public async Task GetEmployees_ReturnsOkWithList()
    {
        // Arrange
        var sampleList = new List<EmployeeResponse>
        {
            new() { Id = 1, FullName = "Alice", Email = "alice@example.com", Department = "IT", Salary = 80000m, IsActive = true }
        };
        _serviceMock.Setup(s => s.GetAllEmployeesAsync(null, null, null, default))
            .ReturnsAsync(sampleList);

        var controller = new EmployeesController(_serviceMock.Object, _loggerMock.Object);

        // Act
        var result = await controller.GetEmployees(null, null, null, default);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<EmployeeResponse>>(okResult.Value);
        Assert.Single(items);
    }

    [Fact]
    public async Task GetEmployeeById_WhenFound_ReturnsOk()
    {
        // Arrange
        var employee = new EmployeeResponse { Id = 10, FullName = "Bob", Email = "bob@example.com", Department = "Sales", Salary = 60000m };
        _serviceMock.Setup(s => s.GetEmployeeByIdAsync(10, default))
            .ReturnsAsync(employee);

        var controller = new EmployeesController(_serviceMock.Object, _loggerMock.Object);

        // Act
        var result = await controller.GetEmployeeById(10, default);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedEmp = Assert.IsType<EmployeeResponse>(okResult.Value);
        Assert.Equal(10, returnedEmp.Id);
    }

    [Fact]
    public async Task GetEmployeeById_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        _serviceMock.Setup(s => s.GetEmployeeByIdAsync(99, default))
            .ReturnsAsync((EmployeeResponse?)null);

        var controller = new EmployeesController(_serviceMock.Object, _loggerMock.Object);

        // Act
        var result = await controller.GetEmployeeById(99, default);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateEmployee_ValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var request = new CreateEmployeeRequest
        {
            FullName = "Charlie",
            Email = "charlie@example.com",
            Department = "Marketing",
            Salary = 72000m
        };

        var createdResponse = new EmployeeResponse
        {
            Id = 5,
            FullName = "Charlie",
            Email = "charlie@example.com",
            Department = "Marketing",
            Salary = 72000m,
            IsActive = true
        };

        _serviceMock.Setup(s => s.CreateEmployeeAsync(request, default))
            .ReturnsAsync(createdResponse);

        var controller = new EmployeesController(_serviceMock.Object, _loggerMock.Object);

        // Act
        var result = await controller.CreateEmployee(request, default);

        // Assert
        var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(EmployeesController.GetEmployeeById), createdAtResult.ActionName);
        Assert.Equal(5, createdAtResult.RouteValues?["id"]);
        Assert.Equal(createdResponse, createdAtResult.Value);
    }

    [Fact]
    public async Task DeleteEmployee_WhenFound_ReturnsNoContent()
    {
        // Arrange
        _serviceMock.Setup(s => s.DeleteEmployeeAsync(3, default))
            .ReturnsAsync(true);

        var controller = new EmployeesController(_serviceMock.Object, _loggerMock.Object);

        // Act
        var result = await controller.DeleteEmployee(3, default);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }
}
