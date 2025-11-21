import { useContext } from 'react';

// auth provider
import AuthContext, { CONTEXT_PROVIDED } from 'contexts/JWTContext';
// import AuthContext from 'contexts/FirebaseContext';
// import AuthContext from 'contexts/AWSCognitoContext';
// import AuthContext from 'contexts/Auth0Context';

// ==============================|| HOOKS - AUTH ||============================== //

export default function useAuth() {
  const context = useContext(AuthContext);

  // Check if context is from provider (has CONTEXT_PROVIDED flag set to true)
  if (!context || !context[CONTEXT_PROVIDED]) {
    throw new Error('context must be use inside provider');
  }

  return context;
}

