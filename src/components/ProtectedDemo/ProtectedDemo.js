import React from 'react';
import { Navigate } from 'react-router-dom';
import Play from '../Play/Play';

const ProtectedDemo = () => {
  // Check if user has completed Twitter actions
  const twitterActions = localStorage.getItem('twitterActions');
  const hasCompletedActions = twitterActions ? 
    Object.values(JSON.parse(twitterActions)).every(action => action === true) : 
    false;

  if (!hasCompletedActions) {
    return <Navigate to="/twitter-verify" replace />;
  }

  return <Play />;
};

export default ProtectedDemo; 