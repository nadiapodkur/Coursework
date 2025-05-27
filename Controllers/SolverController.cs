using CourseWork2.Models;
using CourseWork2.Services;
using Microsoft.AspNetCore.Mvc;

namespace CourseWork2.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SolverController : ControllerBase
{
    private readonly INonLinearSolverService _solverService;

    public SolverController(INonLinearSolverService solverService)
    {
        _solverService = solverService;
    }

    [HttpPost("solve")]
    public IActionResult SolveSystem([FromBody] SolverRequest request)
    {
        if (request == null)
        {
            return BadRequest(new SolutionResponse { ErrorMessage = "Запит не може бути порожнім." });
        }

        if (request.EquationStrings == null || !request.EquationStrings.Any())
        {
            return BadRequest(new SolutionResponse { ErrorMessage = "Список рівнянь не може бути порожнім." });
        }
        if (request.VariableNames == null || !request.VariableNames.Any())
        {
            return BadRequest(new SolutionResponse { ErrorMessage = "Список імен змінних не може бути порожнім." });
        }
         if (request.InitialGuess == null || !request.InitialGuess.Any())
        {
            return BadRequest(new SolutionResponse { ErrorMessage = "Початкове наближення не може бути порожнім." });
        }
        if (request.EquationStrings.Count != request.VariableNames.Count || request.EquationStrings.Count != request.InitialGuess.Count)
        {
             return BadRequest(new SolutionResponse { ErrorMessage = "Кількість рівнянь, імен змінних та значень початкового наближення має співпадати." });
        }
        if (request.Tolerance <= 0)
        {
            return BadRequest(new SolutionResponse { ErrorMessage = "Точність має бути позитивним числом." });
        }
        if (request.MaxIterations <= 0)
        {
            return BadRequest(new SolutionResponse { ErrorMessage = "Максимальна кількість ітерацій має бути позитивним числом." });
        }


        var result = _solverService.Solve(request);

        if (!string.IsNullOrEmpty(result.ErrorMessage) && result.Solution == null && !result.Converged)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
