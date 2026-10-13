using EmployeeManagement.Api.DTOs;
using EmployeeManagement.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly ILogger<EmployeesController> _logger;

    public EmployeesController(IEmployeeService employeeService, ILogger<EmployeesController> logger)
    {
        _employeeService = employeeService ?? throw new ArgumentNullException(nameof(employeeService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves all employees with optional searching and filtering.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EmployeeResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeResponse>>> GetEmployees(
        [FromQuery] string? search,
        [FromQuery] string? department,
        [FromQuery] bool? isActive,
        CancellationToken cancellationToken)
    {
        var employees = await _employeeService.GetAllEmployeesAsync(search, department, isActive, cancellationToken);
        return Ok(employees);
    }

    /// <summary>
    /// Retrieves a specific employee by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(EmployeeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeResponse>> GetEmployeeById(int id, CancellationToken cancellationToken)
    {
        var employee = await _employeeService.GetEmployeeByIdAsync(id, cancellationToken);
        if (employee == null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = $"Employee with ID {id} was not found."
            });
        }

        return Ok(employee);
    }

    /// <summary>
    /// Creates a new employee record.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(EmployeeResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EmployeeResponse>> CreateEmployee(
        [FromBody] CreateEmployeeRequest request,
        CancellationToken cancellationToken)
    {
        var created = await _employeeService.CreateEmployeeAsync(request, cancellationToken);

        return CreatedAtAction(
            nameof(GetEmployeeById),
            new { id = created.Id },
            created);
    }

    /// <summary>
    /// Updates an existing employee record.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(EmployeeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EmployeeResponse>> UpdateEmployee(
        int id,
        [FromBody] UpdateEmployeeRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await _employeeService.UpdateEmployeeAsync(id, request, cancellationToken);
        return Ok(updated);
    }

    /// <summary>
    /// Deletes an employee by ID.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEmployee(int id, CancellationToken cancellationToken)
    {
        await _employeeService.DeleteEmployeeAsync(id, cancellationToken);
        return NoContent();
    }
}
