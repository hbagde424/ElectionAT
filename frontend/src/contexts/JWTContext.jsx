import { createContext, useEffect, useReducer } from 'react';

// third-party
import { Chance } from 'chance';
import { jwtDecode } from 'jwt-decode';

// reducer - state management
import { LOGIN, LOGOUT } from 'contexts/auth-reducer/actions';
import authReducer from 'contexts/auth-reducer/auth';

// project-imports
import Loader from 'components/Loader';
import axios from 'utils/axios';

const chance = new Chance();

// constant
const initialState = {
  isLoggedIn: false,
  isInitialized: false,
  user: null
};

const verifyToken = (serviceToken) => {
  if (!serviceToken) {
    return false;
  }
  const decoded = jwtDecode(serviceToken);

  /**
   * Property 'exp' does not exist on type '<T = unknown>(token: string, options?: JwtDecodeOptions | undefined) => T'.
   */
  return decoded.exp > Date.now() / 1000;
};

const setSession = (serviceToken) => {
  if (serviceToken) {
    localStorage.setItem('serviceToken', serviceToken);
    axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
  } else {
    localStorage.removeItem('serviceToken');
    delete axios.defaults.headers.common.Authorization;
  }
};

// ==============================|| JWT CONTEXT & PROVIDER ||============================== //

// Create context with default values to prevent "context must be use inside provider" error
// Use a symbol to identify if context is from provider
export const CONTEXT_PROVIDED = Symbol('CONTEXT_PROVIDED');
const JWTContext = createContext({
  isLoggedIn: false,
  isInitialized: false,
  user: null,
  login: async () => { },
  logout: () => { },
  register: async () => { },
  resetPassword: async () => { },
  updateProfile: () => { },
  [CONTEXT_PROVIDED]: false // Flag to identify default context
});

export const JWTProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const serviceToken = window.localStorage.getItem('serviceToken');
        if (serviceToken && verifyToken(serviceToken)) {
          // Skip API validation on startup, just check token validity
          setSession(serviceToken);
          dispatch({
            type: LOGIN,
            payload: {
              isLoggedIn: true,
              user: { name: 'User' } // Placeholder user until API validates
            }
          });
        } else {
          // Clear invalid token
          localStorage.removeItem('serviceToken');
          dispatch({
            type: LOGOUT
          });
        }
      } catch (err) {
        console.error('JWT initialization error:', err);
        // Clear any invalid tokens
        localStorage.removeItem('serviceToken');
        dispatch({
          type: LOGOUT
        });
      }
    };

    init();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Frontend login attempt:', { email, password });
      console.log('API URL:', import.meta.env.VITE_APP_API_URL);
      console.log('Full login URL:', `${import.meta.env.VITE_APP_API_URL}/auth/login`);

      const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/auth/login`, { email, password });

      console.log('Login response:', response);
      console.log('Login response data:', response.data);

      const { token, user } = response.data;

      console.log('Extracted token:', token);
      console.log('Extracted user:', user);

      // Use existing `setSession()` function with the new token
      setSession(token);

      // Store user data in localStorage for PermissionContext
      localStorage.setItem('user', JSON.stringify(user));

      // Dispatch custom event to notify PermissionContext of user change
      window.dispatchEvent(new CustomEvent('userChanged', { detail: { user } }));

      dispatch({
        type: LOGIN,
        payload: {
          isLoggedIn: true,
          user
        }
      });
    } catch (error) {
      console.error('Frontend login error:', error);
      console.error('Error response:', error.response);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };


  const register = async (email, password, firstName, lastName) => {
    // todo: this flow need to be recode as it not verified
    const id = chance.bb_pin();
    const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/account/register`, {
      id,
      email,
      password,
      firstName,
      lastName
    });
    let users = response.data;

    if (window.localStorage.getItem('users') !== undefined && window.localStorage.getItem('users') !== null) {
      const localUsers = window.localStorage.getItem('users');
      users = [
        ...JSON.parse(localUsers),
        {
          id,
          email,
          password,
          name: `${firstName} ${lastName}`
        }
      ];
    }

    window.localStorage.setItem('users', JSON.stringify(users));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('user'); // Remove user data from localStorage
    
    // Dispatch custom event to notify PermissionContext of logout
    window.dispatchEvent(new CustomEvent('userChanged', { detail: { user: null } }));
    
    dispatch({ type: LOGOUT });
  };

  const resetPassword = async (email) => {
    // TODO: Implement password reset functionality
  };

  const updateProfile = () => { };

  // Always render the Provider so context is available, show loader inside if needed
  const contextValue = { ...state, login, logout, register, resetPassword, updateProfile, [CONTEXT_PROVIDED]: true };

  if (state.isInitialized !== undefined && !state.isInitialized) {
    return (
      <JWTContext.Provider value={contextValue}>
        <Loader />
      </JWTContext.Provider>
    );
  }

  return <JWTContext.Provider value={contextValue}>{children}</JWTContext.Provider>;
};

export default JWTContext;

