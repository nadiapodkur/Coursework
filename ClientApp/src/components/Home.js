import React, { useState, useEffect } from 'react';

// Helper to generate unique IDs for equations
let equationIdCounter = 0;
const generateEquationId = () => `eq-${equationIdCounter++}`;

export function Home() {
    const [equations, setEquations] = useState([
        { id: generateEquationId(), eqString: 'Sqrt(7 - x2)', variableName: 'x1', initialGuess: '1.0' },
        { id: generateEquationId(), eqString: 'Sqrt(11 - x1)', variableName: 'x2', initialGuess: '1.5' }
    ]);
    const [tolerance, setTolerance] = useState('1e-7');
    const [maxIterations, setMaxIterations] = useState('100');
    const [solverType, setSolverType] = useState('SimpleIteration'); // 'SimpleIteration' or 'GaussSeidel'

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Effect to reset counter if component unmounts and remounts (for development hot-reloading)
    useEffect(() => {
        equationIdCounter = equations.length > 0 ? Math.max(...equations.map(eq => parseInt(eq.id.split('-')[1]))) + 1 : 0;
        return () => {
            // cleanup if needed
        };
    }, []);


    const handleAddEquation = () => {
        if (equations.length < 10) {
            setEquations([...equations, { id: generateEquationId(), eqString: '', variableName: '', initialGuess: '' }]);
        } else {
            alert('Maximum of 10 equations allowed.');
        }
    };

    const handleRemoveEquation = (idToRemove) => {
        if (equations.length > 1) {
            setEquations(equations.filter(eq => eq.id !== idToRemove));
        } else {
            alert('At least one equation is required.');
        }
    };

    const handleEquationChange = (id, field, value) => {
        setEquations(equations.map(eq =>
            eq.id === id ? { ...eq, [field]: value } : eq
        ));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setResult(null);
        setError('');

        const equationStrings = equations.map(eq => eq.eqString);
        const variableNames = equations.map(eq => eq.variableName);
        const initialGuess = equations.map(eq => parseFloat(eq.initialGuess));

        // Basic validation
        if (equations.some(eq => !eq.eqString || !eq.variableName || isNaN(parseFloat(eq.initialGuess)))) {
            setError('Please fill in all fields for each equation correctly.');
            setIsLoading(false);
            return;
        }
        if (isNaN(parseFloat(tolerance)) || parseFloat(tolerance) <= 0) {
            setError('Tolerance must be a positive number.');
            setIsLoading(false);
            return;
        }
        if (isNaN(parseInt(maxIterations)) || parseInt(maxIterations) <= 0) {
            setError('Max iterations must be a positive integer.');
            setIsLoading(false);
            return;
        }
        if (new Set(variableNames).size !== variableNames.length) {
            setError('Variable names must be unique.');
            setIsLoading(false);
            return;
        }


        const payload = {
            equationStrings,
            variableNames,
            initialGuess,
            tolerance: parseFloat(tolerance),
            maxIterations: parseInt(maxIterations),
            solverType: solverType
        };

        try {
            const response = await fetch('http://localhost:5291/api/solver/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.errorMessage || data.title || `Error ${response.status}: ${response.statusText}`);
                setResult(data); // Store partial error response if available
            } else {
                setResult(data);
            }
        } catch (e) {
            console.error("Fetch error:", e);
            setError('Failed to connect to the server. Please check your network or server status.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 font-sans">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">Non-Linear System Solver</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Equations Section */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-600">Equations (x<sub>i</sub> = g<sub>i</sub>(...))</h2>
                    {equations.map((eq, index) => (
                        <div key={eq.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4 p-3 border border-gray-200 rounded-md items-center">
                            <label htmlFor={`eqString-${eq.id}`} className="md:col-span-1 text-sm font-medium text-gray-700 self-center">
                                x<sub>{index + 1}</sub> =
                            </label>
                            <input
                                type="text"
                                id={`eqString-${eq.id}`}
                                placeholder={`e.g., Sqrt(7 - ${eq.variableName || 'var'})`}
                                value={eq.eqString}
                                onChange={(e) => handleEquationChange(eq.id, 'eqString', e.target.value)}
                                className="md:col-span-5 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            <label htmlFor={`varName-${eq.id}`} className="md:col-span-2 text-sm font-medium text-gray-700 self-center md:text-right pr-2">
                                Variable (x<sub>{index + 1}</sub>):
                            </label>
                            <input
                                type="text"
                                id={`varName-${eq.id}`}
                                placeholder={`e.g., x${index + 1}`}
                                value={eq.variableName}
                                onChange={(e) => handleEquationChange(eq.id, 'variableName', e.target.value)}
                                className="md:col-span-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            <label htmlFor={`initGuess-${eq.id}`} className="md:col-span-1 text-sm font-medium text-gray-700 self-center md:text-right pr-2">
                                Guess:
                            </label>
                            <input
                                type="number"
                                step="any"
                                id={`initGuess-${eq.id}`}
                                placeholder="e.g., 1.0"
                                value={eq.initialGuess}
                                onChange={(e) => handleEquationChange(eq.id, 'initialGuess', e.target.value)}
                                className="md:col-span-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            <div className="md:col-span-1 flex justify-end">
                                {equations.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveEquation(eq.id)}
                                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-sm"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={handleAddEquation}
                        disabled={equations.length >= 10}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
                    >
                        Add Equation
                    </button>
                </div>

                {/* Parameters Section */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-600">Solver Parameters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="tolerance" className="block text-sm font-medium text-gray-700 mb-1">Tolerance:</label>
                            <input
                                type="text"
                                id="tolerance"
                                value={tolerance}
                                onChange={(e) => setTolerance(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="maxIterations" className="block text-sm font-medium text-gray-700 mb-1">Max Iterations:</label>
                            <input
                                type="number"
                                id="maxIterations"
                                value={maxIterations}
                                onChange={(e) => setMaxIterations(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="solverType" className="block text-sm font-medium text-gray-700 mb-1">Solver Type:</label>
                            <select
                                id="solverType"
                                value={solverType}
                                onChange={(e) => setSolverType(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            >
                                <option value="SimpleIteration">Simple Iteration (Jacobi)</option>
                                <option value="GaussSeidel">Gauss-Seidel</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-70"
                    >
                        {isLoading ? 'Solving...' : 'Solve System'}
                    </button>
                </div>
            </form>

            {/* Error Display */}
            {error && (
                <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-sm">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Results Section */}
            {result && !error && ( // Only show results if there's a result object and no overriding error message from handleSubmit
                <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Results</h2>
                    {result.errorMessage && !result.converged && ( // Backend error message
                        <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md mb-4">
                            <p className="font-medium">Note: {result.errorMessage}</p>
                        </div>
                    )}
                    <div className="space-y-3">
                        <p className="text-gray-600"><strong className="font-medium text-gray-800">Solver Type:</strong> {result.solverType}</p>
                        <p className="text-gray-600"><strong className="font-medium text-gray-800">Converged:</strong>
                            <span className={result.converged ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                {result.converged ? 'Yes' : 'No'}
                            </span>
                        </p>
                        {result.iterations != null && (
                            <p className="text-gray-600"><strong className="font-medium text-gray-800">Iterations:</strong> {result.iterations}</p>
                        )}
                        {result.solution && result.solution.length > 0 ? (
                            <div>
                                <strong className="font-medium text-gray-800">Solution (x<sub>i</sub>):</strong>
                                <ul className="list-disc list-inside pl-4 mt-1">
                                    {result.solution.map((val, index) => (
                                        <li key={index} className="text-gray-600">
                                            {equations[index]?.variableName || `x${index + 1}`}: {val.toFixed(7)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-gray-600">{result.converged ? "Solution data not available." : "No solution found."}</p>
                        )}
                    </div>
                </div>
            )}
            {result && result.errorMessage && error && ( // If frontend error occurred but we also have backend info
                <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md shadow-sm">
                    <p className="font-semibold">Additional Info from Server:</p>
                    <p>{result.errorMessage}</p>
                    {result.solution && <p>Last approximation: {JSON.stringify(result.solution)}</p>}
                </div>
            )}
        </div>
    );
}
