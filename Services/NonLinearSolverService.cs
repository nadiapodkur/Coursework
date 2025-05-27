using System.Globalization;
using System.Linq.Expressions;
using CourseWork2.Models;
using NCalc;
using Expression = NCalc.Expression;

namespace CourseWork2.Services;

public class NonLinearSolverService: INonLinearSolverService
{
    public SolutionResponse Solve(SolverRequest request)
    {
        if (request.EquationStrings == null || !request.EquationStrings.Any() ||
            request.VariableNames == null || !request.VariableNames.Any() ||
            request.InitialGuess == null || !request.InitialGuess.Any())
        {
            return new SolutionResponse { ErrorMessage = "Рівняння, імена змінних та початкове наближення не можуть бути порожніми." };
        }

        if (request.EquationStrings.Count != request.VariableNames.Count ||
            request.EquationStrings.Count != request.InitialGuess.Count)
        {
            return new SolutionResponse { ErrorMessage = "Кількість рівнянь, імен змінних та значень початкового наближення має співпадати." };
        }
        
        CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

        try
        {
            return request.SolverType switch
            {
                SolverMethodType.SimpleIteration =>
                    SimpleIterationMethod(request.EquationStrings, request.VariableNames, request.InitialGuess, request.Tolerance, request.MaxIterations),
                SolverMethodType.GaussSeidel =>
                    GaussSeidelMethod(request.EquationStrings, request.VariableNames, request.InitialGuess, request.Tolerance, request.MaxIterations),
                _ => new SolutionResponse { ErrorMessage = "Невідомий тип методу розв'язання." }
            };
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Помилка під час розв'язання: {ex}");
            return new SolutionResponse { ErrorMessage = $"Внутрішня помилка сервера: {ex.Message}" };
        }
    }

    private SolutionResponse SimpleIterationMethod(
        List<string> equationStrings,
        List<string> variableNames,
        List<double> x0,
        double tol,
        int maxIter)
    {
        int n = equationStrings.Count;
        List<double> x_k = new List<double>(x0);
        List<Expression> expressions = new List<Expression>();

        foreach (var eqStr in equationStrings)
        {
            var expr = new Expression(eqStr, ExpressionOptions.IgnoreCaseAtBuiltInFunctions);
            if (expr.HasErrors())
            {
                return new SolutionResponse { ErrorMessage = $"Синтаксична помилка у рівнянні '{eqStr}': {expr.Error}" , SolverType = SolverMethodType.SimpleIteration.ToString()};
            }
            expressions.Add(expr);
        }

        for (int iteration = 0; iteration < maxIter; iteration++)
        {
            List<double> x_k_plus_1 = new List<double>(new double[n]);

            for (int i = 0; i < n; i++)
            {
                Expression currentExpression = expressions[i];
                for (int j = 0; j < n; j++)
                {
                    currentExpression.Parameters[variableNames[j]] = x_k[j];
                }

                try
                {
                    object evalResult = currentExpression.Evaluate();
                    if (evalResult is double || evalResult is int || evalResult is decimal)
                    {
                        x_k_plus_1[i] = Convert.ToDouble(evalResult, CultureInfo.InvariantCulture);
                    }
                    else
                    {
                         return new SolutionResponse { ErrorMessage = $"Рівняння '{equationStrings[i]}' повернуло нечисловий результат типу '{evalResult?.GetType().Name}'.", Iterations = iteration + 1, Converged = false, SolverType = SolverMethodType.SimpleIteration.ToString() };
                    }

                    if (double.IsNaN(x_k_plus_1[i]) || double.IsInfinity(x_k_plus_1[i]))
                    {
                        return new SolutionResponse { ErrorMessage = $"Обчислення g{i + 1} ('{equationStrings[i]}') призвело до NaN/Infinity на ітерації {iteration + 1}.", Solution = x_k, Iterations = iteration + 1, Converged = false, SolverType = SolverMethodType.SimpleIteration.ToString() };
                    }
                }
                catch (Exception ex)
                {
                    return new SolutionResponse { ErrorMessage = $"Помилка обчислення рівняння '{equationStrings[i]}' на ітерації {iteration + 1}: {ex.Message}", Solution = x_k, Iterations = iteration + 1, Converged = false, SolverType = SolverMethodType.SimpleIteration.ToString() };
                }
            }

            double errorSum = 0;
            for (int j = 0; j < n; j++)
            {
                errorSum += Math.Pow(x_k_plus_1[j] - x_k[j], 2);
            }
            double error = Math.Sqrt(errorSum);

            if (error < tol)
            {
                return new SolutionResponse { Solution = x_k_plus_1, Iterations = iteration + 1, Converged = true, SolverType = SolverMethodType.SimpleIteration.ToString()};
            }
            x_k = new List<double>(x_k_plus_1);
        }

        return new SolutionResponse { Solution = x_k, Iterations = maxIter, Converged = false, ErrorMessage = "Максимальну кількість ітерацій досягнуто без збіжності.", SolverType = SolverMethodType.SimpleIteration.ToString()};
    }

    private SolutionResponse GaussSeidelMethod(
        List<string> equationStrings,
        List<string> variableNames,
        List<double> x0,
        double tol,
        int maxIter)
    {
        int n = equationStrings.Count;
        List<double> x_current = new List<double>(x0);
        List<Expression> expressions = new List<Expression>();

        foreach (var eqStr in equationStrings)
        {
             var expr = new Expression(eqStr, ExpressionOptions.IgnoreCaseAtBuiltInFunctions);
             if (expr.HasErrors())
             {
                return new SolutionResponse { ErrorMessage = $"Синтаксична помилка у рівнянні '{eqStr}': {expr.Error}", SolverType = SolverMethodType.GaussSeidel.ToString() };
             }
             expressions.Add(expr);
        }

        for (int iteration = 0; iteration < maxIter; iteration++)
        {
            List<double> x_previous_iter = new List<double>(x_current);

            for (int i = 0; i < n; i++)
            {
                Expression currentExpression = expressions[i];
                for (int j = 0; j < n; j++)
                {
                    currentExpression.Parameters[variableNames[j]] = x_current[j];
                }
                
                try
                {
                    object evalResult = currentExpression.Evaluate();
                    if (evalResult is double || evalResult is int || evalResult is decimal)
                    {
                        x_current[i] = Convert.ToDouble(evalResult, CultureInfo.InvariantCulture);
                    }
                    else
                    {
                        return new SolutionResponse { ErrorMessage = $"Рівняння '{equationStrings[i]}' повернуло нечисловий результат типу '{evalResult?.GetType().Name}'.", Iterations = iteration + 1, Converged = false, SolverType = SolverMethodType.GaussSeidel.ToString() };
                    }


                    if (double.IsNaN(x_current[i]) || double.IsInfinity(x_current[i]))
                    {
                        return new SolutionResponse { ErrorMessage = $"Обчислення g{i + 1} ('{equationStrings[i]}') призвело до NaN/Infinity на ітерації {iteration + 1}.", Solution = x_previous_iter, Iterations = iteration + 1, Converged = false, SolverType = SolverMethodType.GaussSeidel.ToString() };
                    }
                }
                catch (Exception ex)
                {
                    return new SolutionResponse { ErrorMessage = $"Помилка обчислення рівняння '{equationStrings[i]}' на ітерації {iteration + 1}: {ex.Message}", Solution = x_previous_iter, Iterations = iteration + 1, Converged = false, SolverType = SolverMethodType.GaussSeidel.ToString() };
                }
            }
            
            double errorSum = 0;
            for (int j = 0; j < n; j++)
            {
                errorSum += Math.Pow(x_current[j] - x_previous_iter[j], 2);
            }
            double error = Math.Sqrt(errorSum);

            if (error < tol)
            {
                return new SolutionResponse { Solution = x_current, Iterations = iteration + 1, Converged = true, SolverType = SolverMethodType.GaussSeidel.ToString()};
            }
        }
        return new SolutionResponse { Solution = x_current, Iterations = maxIter, Converged = false, ErrorMessage = "Максимальну кількість ітерацій досягнуто без збіжності.", SolverType = SolverMethodType.GaussSeidel.ToString()};
    }
}