import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const [message, setMessage] = useState('Processing authentication...');
  const navigate = useNavigate();

  useEffect(() => {
    const { hash } = window.location;
    
    const handleAuthCallback = async () => {
      try {
        // Check if we have a hash in the URL
        if (hash) {
          console.log('Auth callback triggered with hash');
          
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth callback error:', error);
            setMessage('Authentication failed. Please try again.');
            return;
          }
          
          if (data.session) {
            console.log('Session established:', !!data.session);
            setMessage('Authentication successful! Redirecting...');
            setTimeout(() => navigate('/'), 1500);
          } else {
            // Try to exchange the URL hash for a session
            const { error: signInError } = await supabase.auth.getUser();
            
            if (signInError) {
              console.error('Failed to get user:', signInError);
              setMessage('Failed to verify your account. Please try again.');
            } else {
              setMessage('Account verified! Redirecting...');
              setTimeout(() => navigate('/'), 1500);
            }
          }
        } else {
          // No hash, just redirect to home
          navigate('/');
        }
      } catch (err) {
        console.error('Auth callback processing error:', err);
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          {message}
        </h2>
        <div className="animate-pulse flex justify-center">
          <div className="h-4 w-4 bg-blue-600 rounded-full mx-1"></div>
          <div className="h-4 w-4 bg-blue-600 rounded-full mx-1 animation-delay-200"></div>
          <div className="h-4 w-4 bg-blue-600 rounded-full mx-1 animation-delay-400"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
