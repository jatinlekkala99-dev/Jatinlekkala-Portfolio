using EmployeeManagement.Api.Data;
using EmployeeManagement.Api.DTOs;
using EmployeeManagement.Api.Exceptions;
using EmployeeManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Api.Services;

public class EmployeeService : IEmployeeService
{
    private readonly AppDbContext _context;
    private readonly ILogger<EmployeeService> _logger;

    public EmployeeService(AppDbContext context, ILogger<EmployeeService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IEnumerable<EmployeeResponse>> GetAllEmployeesAsync(
        string? search = null,
        string? department = null,
        bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Employee> query = _context.Employees.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(e =>
                e.FullName.ToLower().Contains(searchLower) ||
                e.Email.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(department))
        {
            var deptTrimmed = department.Trim();
            query = query.Where(e => e.Department == deptTrimmed);
        }

        if (isActive.HasValue)
        {
            query = query.Where(e => e.IsActive == isActive.Value);
        }

        var employees = await query
            .OrderByDescending(e => e.CreatedAtUtc)
            .Select(e => MapToResponse(e))
            .ToListAsync(cancellationToken);

        return employees;
    }

    public async Task<EmployeeResponse?> GetEmployeeByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var employee = await _context.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        return employee == null ? null : MapToResponse(employee);
    }

    public async Task<EmployeeResponse> CreateEmployeeAsync(CreateEmployeeRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        if (request.Salary <= 0)
            throw new ArgumentException("Salary must be strictly greater than zero.", nameof(request.Salary));

        var normalizedEmail = NormalizeEmail(request.Email);

        // Application-level check
        var exists = await _context.Employees
            .AsNoTracking()
            .AnyAsync(e => e.Email.ToLower() == normalizedEmail, cancellationToken);

        if (exists)
        {
            _logger.LogWarning("Create failed: Employee with email {Email} already exists.", normalizedEmail);
            throw new DuplicateEmailException(normalizedEmail);
        }

        var employee = new Employee
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            Department = request.Department.Trim(),
            Salary = request.Salary,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Employees.Add(employee);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully created employee with ID {Id} and email {Email}.", employee.Id, employee.Email);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "DbUpdateException when saving employee {Email}.", normalizedEmail);
            // In case of race condition caught by the database unique index IX_Employees_Email_Unique
            if (await _context.Employees.AnyAsync(e => e.Email.ToLower() == normalizedEmail, cancellationToken))
            {
                throw new DuplicateEmailException(normalizedEmail);
            }
            throw;
        }

        return MapToResponse(employee);
    }

    public async Task<EmployeeResponse> UpdateEmployeeAsync(int id, UpdateEmployeeRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        if (request.Salary <= 0)
            throw new ArgumentException("Salary must be strictly greater than zero.", nameof(request.Salary));

        var employee = await _context.Employees.FindAsync(new object[] { id }, cancellationToken);
        if (employee == null)
        {
            _logger.LogWarning("Update failed: Employee with ID {Id} not found.", id);
            throw new NotFoundException($"Employee with ID {id} was not found.");
        }

        var normalizedEmail = NormalizeEmail(request.Email);

        // Ensure email doesn't belong to ANOTHER employee
        var emailConflict = await _context.Employees
            .AsNoTracking()
            .AnyAsync(e => e.Email.ToLower() == normalizedEmail && e.Id != id, cancellationToken);

        if (emailConflict)
        {
            _logger.LogWarning("Update failed: Email {Email} is already taken by another employee.", normalizedEmail);
            throw new DuplicateEmailException(normalizedEmail);
        }

        employee.FullName = request.FullName.Trim();
        employee.Email = normalizedEmail;
        employee.Department = request.Department.Trim();
        employee.Salary = request.Salary;
        employee.IsActive = request.IsActive;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully updated employee with ID {Id}.", id);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "DbUpdateException when updating employee {Id}.", id);
            if (await _context.Employees.AnyAsync(e => e.Email.ToLower() == normalizedEmail && e.Id != id, cancellationToken))
            {
                throw new DuplicateEmailException(normalizedEmail);
            }
            throw;
        }

        return MapToResponse(employee);
    }

    public async Task<bool> DeleteEmployeeAsync(int id, CancellationToken cancellationToken = default)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, cancellationToken);
        if (employee == null)
        {
            _logger.LogWarning("Delete failed: Employee with ID {Id} not found.", id);
            throw new NotFoundException($"Employee with ID {id} was not found.");
        }

        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Successfully deleted employee with ID {Id}.", id);
        return true;
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static EmployeeResponse MapToResponse(Employee entity) => new()
    {
        Id = entity.Id,
        FullName = entity.FullName,
        Email = entity.Email,
        Department = entity.Department,
        Salary = entity.Salary,
        IsActive = entity.IsActive,
        CreatedAtUtc = entity.CreatedAtUtc
    };
}
