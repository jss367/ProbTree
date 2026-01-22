import React from 'react';
import ProbabilityDistributionVisualizer from './components/ProbabilityDistributionVisualizer';
import useFirebase from './hooks/useFirebase';

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
    </div>
  );
}

export default App;
