using System.Text.Json.Serialization;

namespace CourseWork2.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SolverMethodType
{
    SimpleIteration,
    GaussSeidel
}