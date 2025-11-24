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
              i++;
              const doBody = [];
              while (i < lines.length && (lines[i].startsWith('  ') || lines[i].startsWith('\t'))) {
                const stmt = lines[i].trim();
                if (stmt) doBody.push(stmt);
                i++;
              }
              functions[funcName].push({ pattern: args, body: doBody, isDo: true });
            } else if (bodyStart === '' || trimmed.endsWith('=')) {
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
        
        if (expr.match(/^".*"$/)) return expr.slice(1, -1);
        if (expr.match(/^-?\d+$/)) return parseInt(expr);
        if (env[expr] !== undefined) return env[expr];
        
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
        
        if (funcName === 'putStrLn') {
          const val = evaluate(args.join(' '), env);
          outputLines.push(String(val));
          return null;
        }
        
        if (funcName === 'show') {
          return String(evaluate(args.join(' '), env));
        }
        
        if (functions[funcName]) {
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

  const highlightCode = (text) => {
    const keywords = ['do', 'where', 'if', 'then', 'else', 'let', 'in', 'case', 'of', 'data', 'type', 'newtype', 'class', 'instance'];
    const builtins = ['putStrLn', 'show', 'print', 'main'];
    
    let result = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    keywords.forEach(kw => {
      result = result.replace(new RegExp(`\\b${kw}\\b`, 'g'), `<span class="keyword">${kw}</span>`);
    });
    
    builtins.forEach(fn => {
      result = result.replace(new RegExp(`\\b${fn}\\b`, 'g'), `<span class="builtin">${fn}</span>`);
    });
    
    result = result.replace(/"[^"]*"/g, match => `<span class="string">${match}</span>`);
    result = result.replace(/\b\d+\b/g, match => `<span class="number">${match}</span>`);
    result = result.replace(/^(\w+)(?=\s+.*=)/gm, match => `<span class="function">${match}</span>`);
    
    return result;
  };

  const handleScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: #000;
          font-family: 'Courier New', monospace;
          overflow-x: hidden;
        }

        .container {
          min-height: 100vh;
          background: #000;
          padding: 40px 20px;
          position: relative;
        }

        .container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            repeating-linear-gradient(
              0deg,
              rgba(0, 255, 0, 0.03) 0px,
              transparent 1px,
              transparent 2px,
              rgba(0, 255, 0, 0.03) 3px
            );
          pointer-events: none;
          z-index: 1;
        }

        .content {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .header {
          text-align: center;
          margin-bottom: 40px;
          border: 2px solid #00ff00;
          padding: 20px;
          background: rgba(0, 20, 0, 0.8);
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }

        .title {
          font-size: 2.5em;
          color: #00ff00;
          text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00;
          letter-spacing: 4px;
          margin-bottom: 10px;
        }

        .subtitle {
          color: #00aa00;
          font-size: 0.9em;
          letter-spacing: 2px;
        }

        .editor-section {
          margin-bottom: 30px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .label {
          color: #00ff00;
          font-size: 0.9em;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .run-button {
          background: #001a00;
          border: 2px solid #00ff00;
          color: #00ff00;
          padding: 10px 25px;
          font-family: 'Courier New', monospace;
          font-size: 1em;
          cursor: pointer;
          letter-spacing: 2px;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .run-button:hover:not(:disabled) {
          background: #00ff00;
          color: #000;
          box-shadow: 0 0 20px #00ff00;
        }

        .run-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .editor-wrapper {
          border: 2px solid #00ff00;
          background: #001a33;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
        }

        .code-textarea {
          width: 100%;
          height: 400px;
          padding: 15px;
          background: #001a33;
          border: none;
          color: #e0e0e0;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          resize: none;
          outline: none;
          caret-color: #00ff00;
        }

        .code-textarea::selection {
          background: rgba(0, 255, 0, 0.3);
        }

        .console {
          border: 2px solid #00ff00;
          background: #000;
          padding: 15px;
          height: 200px;
          overflow-y: auto;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #00ff00;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
        }

        .console-output {
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .console-placeholder {
          color: #005500;
        }

        .info-box {
          border: 2px solid #00ff00;
          background: rgba(0, 20, 0, 0.6);
          padding: 20px;
          margin-top: 20px;
          display: flex;
          gap: 15px;
        }

        .info-icon {
          color: #00ff00;
          flex-shrink: 0;
        }

        .info-content {
          color: #00aa00;
          font-size: 0.85em;
        }

        .info-title {
          color: #00ff00;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }

        .info-list {
          list-style: none;
          padding-left: 0;
        }

        .info-list li {
          margin: 5px 0;
          padding-left: 15px;
          position: relative;
        }

        .info-list li::before {
          content: '>';
          position: absolute;
          left: 0;
          color: #00ff00;
        }

        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #000;
        }

        ::-webkit-scrollbar-thumb {
          background: #00ff00;
          border: 1px solid #000;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #00cc00;
        }
      `}</style>
      
      <div className="container">
        <div className="content">
          <div className="header">
            <h1 className="title">λ HASKELL TERMINAL</h1>
            <p className="subtitle">FUNCTIONAL PROGRAMMING INTERFACE v1.0</p>
          </div>
          
          <div className="editor-section">
            <div className="section-header">
              <span className="label">&gt; Code Editor</span>
              <button
                onClick={runHaskell}
                disabled={isRunning}
                className="run-button"
              >
                <Play size={16} />
                EXECUTE
              </button>
            </div>
            
            <div className="editor-wrapper">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="code-textarea"
                spellCheck="false"
              />
            </div>
          </div>
          
          <div className="editor-section">
            <div className="section-header">
              <span className="label">&gt; Console Output</span>
            </div>
            <div className="console">
              {output ? (
                <pre className="console-output">{output}</pre>
              ) : (
                <div className="console-placeholder">&gt; Awaiting execution...</div>
              )}
            </div>
          </div>
          
          <div className="info-box">
            <AlertCircle className="info-icon" size={24} />
            <div className="info-content">
              <div className="info-title">SYSTEM CAPABILITIES</div>
              <ul className="info-list">
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
    </>
  );
};

export default HaskellPlayground;
