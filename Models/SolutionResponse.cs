namespace CourseWork2.Models;

public class SolutionResponse
{
    public string SolverType { get; set; } = string.Empty;
    public List<double>? Solution { get; set; }
    public int? Iterations { get; set; }
    public bool Converged { get; set; }
    public string? ErrorMessage { get; set; }
}