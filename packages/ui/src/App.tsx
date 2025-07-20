import React from 'react';
import { VibraniumRouter } from './components/Router/Router';
import { ThemeProvider } from './components/Theme/ThemeProvider';
import './styles/globals.scss';

function App() {
  return (
    <ThemeProvider>
      <VibraniumRouter />
    </ThemeProvider>
  );
}

export default App;