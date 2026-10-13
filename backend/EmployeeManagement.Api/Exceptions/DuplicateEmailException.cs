namespace EmployeeManagement.Api.Exceptions;

public class DuplicateEmailException : Exception
{
    public string Email { get; }

    public DuplicateEmailException(string email)
        : base($"An employee with email '{email}' already exists.")
    {
        Email = email;
    }
}
