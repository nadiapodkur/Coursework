using CourseWork2.Models;

namespace CourseWork2.Services;

public interface INonLinearSolverService
{
    SolutionResponse Solve(SolverRequest request);
}