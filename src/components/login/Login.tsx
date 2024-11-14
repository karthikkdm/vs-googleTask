import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import { gapi } from 'gapi-script';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const clientId =  "830735989734-bhku50l8hsj0bj0d88rgto3sggk75iqg.apps.googleusercontent.com" ;
  const scope = "https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly";

  useEffect(() => {
    const initializeGapiClient = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          gapi.load('client:auth2', {
            callback: resolve,
            onerror: reject,
          });
        });

        await gapi.client.init({
          clientId:clientId,
          scope: scope,
        });

        const authInstance = gapi.auth2.getAuthInstance();
        authInstance.isSignedIn.listen(handleSigninStatusChange);
        handleSigninStatusChange(authInstance.isSignedIn.get(), gapi.client.getToken());
      } catch (error) {
        console.error('Error initializing GAPI:', error);
      }
    };

    initializeGapiClient();
  }, []);

  const handleSigninStatusChange = (isSignedIn: boolean, token: any | null) => {
    if (isSignedIn) {
      setIsAuthenticated(true);
      const authToken = token ? `${token.type} ${token.access_token}` : null;
      setAuthToken(authToken);
      navigate('/dashboard');
    } else {
      setIsAuthenticated(false);
    }
  };
  const handleSubmit =async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      await gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Sign in to your account</h1>
         <form onSubmit={handleSubmit} className="login-form">
          <button type="submit" className="login-button">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;