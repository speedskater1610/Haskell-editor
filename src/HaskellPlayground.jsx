import React, { useState } from 'react';
import { Play, AlertCircle } from 'lucide-react';

const HaskellPlayground = () => {
  const [code, setCode] = useState(`main = do
  putStrLn "Hello, Haskell!"
  putStrLn (show (fibonacci 10))

fibonacci n = fib n 0 1
  where
    fib 0 a b = a
    fib n a b = fib (n-1) b (a+b)

factorial 0 = 1
factorial n = n * factorial (n-1)`);
  
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runHaskell = () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      const outputLines = [];
      const functions = {};
      
      // Parse code into function definitions
      const parseCode = () => {
        const lines = code.split('\n');
        let i = 0;
        
        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();
          
          if (!trimmed || trimmed.startsWith('--')) {
            i++;
            continue;
          }
          
          const match = trimmed.match(/^(\w+)(.*)=\s*(.*)$/);
          if (match) {
            const funcName = match[1];
            const args = match[2].trim();
            const bodyStart = match[3].trim();
            
            if (!functions[funcName]) {
              functions[funcName] = [];
            }
            
            if (bodyStart === 'do') {
              // Parse do block
              i++;
              const doBody = [];
              while (i < lines.length && (lines[i].startsWith('  ') || lines[i].startsWith('\t'))) {
                const stmt = lines[i].trim();
                if (stmt) doBody.push(stmt);
                i++;
              }
              functions[funcName].push({ pattern: args, body: doBody, isDo: true });
            } else if (bodyStart === '' || trimmed.endsWith('=')) {
              // Multi-line with where clause
              i++;
              let bodyLine = '';
              const whereFuncs = [];
              let inWhere = false;
              
              while (i < lines.length && (lines[i].match(/^\s/) || lines[i].trim() === '')) {
                const l = lines[i].trim();
                if (l === '') {
                  i++;
                  continue;
                }
                
                if (l === 'where') {
                  inWhere = true;
                  i++;
                  continue;
                }
                
                if (inWhere) {
                  whereFuncs.push(l);
                } else {
                  bodyLine = l;
                }
                i++;
              }
              
              functions[funcName].push({ 
                pattern: args, 
                body: bodyLine,
                whereFuncs: whereFuncs,
                isDo: false 
              });
            } else {
              // Single line
              functions[funcName].push({ pattern: args, body: bodyStart, isDo: false });
              i++;
            }
          } else {
            i++;
          }
        }
      };
      
      parseCode();
      
      // Evaluator - optimized to reduce stack usage
      const evaluate = (expr, env = {}) => {
        expr = expr.trim();
        
        // Literals
        if (expr.match(/^".*"$/)) return expr.slice(1, -1);
        if (expr.match(/^-?\d+$/)) return parseInt(expr);
        if (env[expr] !== undefined) return env[expr];
        
        // Remove outer parentheses if they wrap the whole expression
        if (expr.startsWith('(') && expr.endsWith(')')) {
          let d = 0;
          let isWrapped = true;
          for (let i = 0; i < expr.length; i++) {
            if (expr[i] === '(') d++;
            if (expr[i] === ')') d--;
            if (d === 0 && i < expr.length - 1) {
              isWrapped = false;
              break;
            }
          }
          if (isWrapped) return evaluate(expr.slice(1, -1), env);
        }
        
        // Tokenize
        const tokens = [];
        let current = '';
        let parenDepth = 0;
        
        for (let i = 0; i < expr.length; i++) {
          const char = expr[i];
          if (char === '(') parenDepth++;
          if (char === ')') parenDepth--;
          
          if (char === ' ' && parenDepth === 0) {
            if (current) tokens.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        if (current) tokens.push(current);
        
        if (tokens.length === 0) return expr;
        
        // Check for infix operators
        const ops = ['+', '-', '*', '/'];
        for (let i = 1; i < tokens.length - 1; i++) {
          if (ops.includes(tokens[i])) {
            const left = evaluate(tokens.slice(0, i).join(' '), env);
            const right = evaluate(tokens.slice(i + 1).join(' '), env);
            if (tokens[i] === '+') return left + right;
            if (tokens[i] === '-') return left - right;
            if (tokens[i] === '*') return left * right;
            if (tokens[i] === '/') return Math.floor(left / right);
          }
        }
        
        const funcName = tokens[0];
        const args = tokens.slice(1);
        
        // Built-ins
        if (funcName === 'putStrLn') {
          const val = evaluate(args.join(' '), env);
          outputLines.push(String(val));
          return null;
        }
        
        if (funcName === 'show') {
          return String(evaluate(args.join(' '), env));
        }
        
        // User functions - handle where clauses first
        if (functions[funcName]) {
          // Pre-process where functions once
          for (const def of functions[funcName]) {
            if (def.whereFuncs && def.whereFuncs.length > 0 && !def.whereProcessed) {
              for (const wf of def.whereFuncs) {
                const wMatch = wf.match(/^(\w+)\s+(.+?)\s*=\s*(.+)$/);
                if (wMatch) {
                  const wName = wMatch[1];
                  const wPattern = wMatch[2].trim();
                  const wBody = wMatch[3].trim();
                  
                  if (!functions[wName]) functions[wName] = [];
                  
                  const exists = functions[wName].some(
                    f => f.pattern === wPattern && f.body === wBody
                  );
                  
                  if (!exists) {
                    functions[wName].push({ 
                      pattern: wPattern, 
                      body: wBody, 
                      isDo: false 
                    });
                  }
                }
              }
              def.whereProcessed = true;
            }
          }
          
          const evalArgs = args.map(a => evaluate(a, env));
          
          for (const def of functions[funcName]) {
            const params = def.pattern.split(/\s+/).filter(p => p);
            
            if (params.length !== evalArgs.length) continue;
            
            const newEnv = { ...env };
            let matched = true;
            
            for (let i = 0; i < params.length; i++) {
              if (params[i].match(/^\d+$/)) {
                if (parseInt(params[i]) !== evalArgs[i]) {
                  matched = false;
                  break;
                }
              } else {
                newEnv[params[i]] = evalArgs[i];
              }
            }
            
            if (matched) {
              if (def.isDo) {
                for (const stmt of def.body) {
                  evaluate(stmt, newEnv);
                }
                return null;
              } else {
                return evaluate(def.body, newEnv);
              }
            }
          }
        }
        
        return expr;
      };
      
      // Run main
      if (!functions.main) {
        throw new Error(`No main function found. Found: ${Object.keys(functions).join(', ')}`);
      }
      
      const mainDef = functions.main[0];
      if (mainDef.isDo) {
        for (const stmt of mainDef.body) {
          evaluate(stmt, {});
        }
      } else {
        evaluate(mainDef.body, {});
      }
      
      setOutput(outputLines.join('\n') || 'Program completed (no output)');
      
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
    
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              λ Haskell Playground
            </h1>
            <p className="text-purple-100 text-sm mt-1">Write and run Haskell code in your browser</p>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Code Editor</label>
                <button
                  onClick={runHaskell}
                  disabled={isRunning}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                >
                  <Play size={16} />
                  Run Code
                </button>
              </div>
              
              <div className="relative">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-96 p-4 font-mono text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                  spellCheck="false"
                  style={{ tabSize: 2 }}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Console Output</label>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-48 overflow-y-auto font-mono text-sm">
                {output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <div className="text-gray-500">Output will appear here...</div>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Supported Features:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Function definitions and recursion</li>
                  <li>Basic arithmetic operations (+, -, *, /)</li>
                  <li>putStrLn and show for output</li>
                  <li>Pattern matching on numbers</li>
                  <li>Where clauses for local functions</li>
                  <li>Do notation for IO</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HaskellPlayground;
