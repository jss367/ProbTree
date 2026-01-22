import React from 'react';
import ProbabilityDistributionVisualizer from './components/ProbabilityDistributionVisualizer';
import useFirebase from './hooks/useFirebase';
import { VERSION } from './version';

function App() {
  const { user, signIn, signOut } = useFirebase();

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        {user ? (
          <button onClick={signOut}>Sign Out</button>
        ) : (
          <button onClick={signIn}>Sign In</button>
        )}
      </div>
      <ProbabilityDistributionVisualizer />
      <footer style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '12px' }}>
        v{VERSION}
      </footer>
    </div>
  );
}

export default App;
