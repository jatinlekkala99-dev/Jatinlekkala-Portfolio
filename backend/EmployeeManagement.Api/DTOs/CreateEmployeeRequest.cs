using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.Api.DTOs;

public class CreateEmployeeRequest
{
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email address is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(150, ErrorMessage = "Email cannot exceed 150 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Department is required.")]
    [StringLength(50, ErrorMessage = "Department cannot exceed 50 characters.")]
    public string Department { get; set; } = string.Empty;

    [Required(ErrorMessage = "Salary is required.")]
    [Range(0.01, 100000000.00, ErrorMessage = "Salary must be greater than zero.")]
    public decimal Salary { get; set; }

    public bool IsActive { get; set; } = true;
}
