using EmployeeManagement.Api.DTOs;

namespace EmployeeManagement.Api.Services;

public interface IEmployeeService
{
    Task<IEnumerable<EmployeeResponse>> GetAllEmployeesAsync(
        string? search = null,
        string? department = null,
        bool? isActive = null,
        CancellationToken cancellationToken = default);

    Task<EmployeeResponse?> GetEmployeeByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<EmployeeResponse> CreateEmployeeAsync(CreateEmployeeRequest request, CancellationToken cancellationToken = default);

    Task<EmployeeResponse> UpdateEmployeeAsync(int id, UpdateEmployeeRequest request, CancellationToken cancellationToken = default);

    Task<bool> DeleteEmployeeAsync(int id, CancellationToken cancellationToken = default);
}
