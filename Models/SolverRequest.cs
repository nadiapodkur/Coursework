namespace CourseWork2.Models;

public class SolverRequest
{
    public List<string> EquationStrings { get; set; } = new List<string>();
    public List<string> VariableNames { get; set; } = new List<string>();
    public List<double> InitialGuess { get; set; } = new List<double>();
    public double Tolerance { get; set; } = 1e-7;
    public int MaxIterations { get; set; } = 100;
    public SolverMethodType SolverType { get; set; } = SolverMethodType.SimpleIteration;
}