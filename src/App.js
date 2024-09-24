import React from 'react';
import ProbabilityDistributionVisualizer from './components/ProbabilityDistributionVisualizer';
import useFirebase from './hooks/useFirebase';

function App() {
  const { user, signIn, signOut } = useFirebase();

  return (
    <div>
      {user ? (
        <>
          <button onClick={signOut}>Sign Out</button>
          <ProbabilityDistributionVisualizer />
        </>
      ) : (
        <button onClick={signIn}>Sign In</button>
      )}
    </div>
  );
}

export default App;
