import { useState } from 'react';
import type { Scenario } from '@vibraniumjs/types';
import './App.css';

function App() {
  const [scenario, setScenario] = useState<Scenario | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Vibranium Web GUI</h1>
        <p>Future web interface for Vibranium CLI</p>
      </header>
      <main className="app-main">
        <div className="placeholder">
          <h2>🚧 Under Construction</h2>
          <p>This web GUI will provide:</p>
          <ul>
            <li>Visual scenario editor</li>
            <li>Real-time execution monitoring</li>
            <li>Interactive test results</li>
            <li>Environment management</li>
            <li>Plugin configuration</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;