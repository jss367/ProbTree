import React from 'react';
import ProbabilityDistributionVisualizer from './components/ProbabilityDistributionVisualizer';
import useFirebase from './hooks/useFirebase';
import { VERSION } from './version';
import './styles.css';

function App() {
  const { user, signIn, signOut } = useFirebase();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="header">
        <h1 className="header-title">ProbTree</h1>
        {user ? (
          <button className="btn btn-secondary btn-sm" onClick={signOut}>Sign Out</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={signIn}>Sign In with Google</button>
        )}
      </header>
      <main style={{ flex: 1 }}>
        <ProbabilityDistributionVisualizer />
      </main>
      <footer className="footer">
        v{VERSION}
      </footer>
    </div>
  );
}

export default App;
