import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';

const useFirebase = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const signIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const signOutUser = () => {
    signOut(auth);
  };

  // Function to save a distribution
  const saveDistribution = async (distribution) => {
    if (!user) return; // Ensure user is logged in
    try {
      await addDoc(collection(db, 'distributions'), {
        userId: user.uid,
        data: distribution,
        createdAt: new Date()
      });
      console.log('Distribution saved successfully');
    } catch (error) {
      console.error('Error saving distribution:', error);
    }
  };

  // Function to load user's distributions
  const loadDistributions = async () => {
    if (!user) return []; // Ensure user is logged in
    const q = query(collection(db, 'distributions'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const shareDistribution = (distributionId) => {
    const shareableLink = `${window.location.origin}/shared/${distributionId}`;
    // You can copy this link to clipboard or display it to the user
    console.log('Shareable link:', shareableLink);
  };


  return { user, signIn, signOut: signOutUser, saveDistribution, loadDistributions, shareDistribution };
};

export default useFirebase;
