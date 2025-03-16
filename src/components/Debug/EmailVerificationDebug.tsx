import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { resendVerificationEmail, checkUserExists, getCurrentSession, forceVerifyUser } from '../../utils/verificationHelper';
import { supabase } from '../../lib/supabase';

/**
 * Debug component to help test email verification in development
 * Only shown in development mode
 */
export const EmailVerificationDebug = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Default test password
  const [name, setName] = useState('Test User');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle resending the verification email
  const handleResendVerification = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // First check if user exists
      const userCheck = await checkUserExists(email);
      
      if (!userCheck.exists) {
        toast.error(`No user found with email ${email}`);
        setDebugInfo(userCheck);
        return;
      }
      
      // User exists, so resend verification email
      const result = await resendVerificationEmail(email);
      toast[result.success ? 'success' : 'error'](result.message);
      setDebugInfo(result);
    } catch (error) {
      console.error('Error resending verification:', error);
      toast.error(`Failed to resend: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Check user existence and status
  const handleCheckStatus = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await checkUserExists(email);
      setDebugInfo(result);
      toast[result.exists ? 'success' : 'error'](result.message);
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error(`Failed to check status: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current session info
  const handleGetSession = async () => {
    setIsLoading(true);
    try {
      const session = await getCurrentSession();
      setDebugInfo(session);
      toast.success(session.hasSession 
        ? `Session found for ${session.user?.email}` 
        : 'No active session found');
    } catch (error) {
      console.error('Error getting session:', error);
      toast.error(`Failed to get session: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Only render in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 border border-gray-700 rounded-lg p-4 text-white text-sm shadow-lg z-50 max-w-sm">
      <h3 className="font-semibold mb-2 flex items-center">
        <span className="bg-red-500 text-white px-1 text-xs rounded mr-2">DEV</span>
        Email Verification Debug
      </h3>
      
      <div className="mb-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
        />
      </div>
      
      <div className="flex space-x-2 mb-3">
        <button
          onClick={handleResendVerification}
          disabled={isLoading}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
        >
          Resend Verification
        </button>
        <button
          onClick={handleCheckStatus}
          disabled={isLoading}
          className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs"
        >
          Check Status
        </button>
        <button
          onClick={handleGetSession}
          disabled={isLoading}
          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-xs"
        >
          Current Session
        </button>
      </div>
      
      <button 
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-gray-400 hover:text-white mb-2"
      >
        {showAdvanced ? '▲ Hide Advanced Options' : '▼ Show Advanced Options'}
      </button>
      
      {showAdvanced && (
        <div className="mb-3 border-t border-gray-700 pt-2">
          <div className="mb-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (for signup)"
              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm mb-1"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (for signup)"
              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </div>
          
          <div className="flex space-x-2 mb-2">
            <button
              onClick={() => {
                // Create direct verification link
                const token = `${Math.random().toString(36).substring(2, 10)}`;
                const url = `${window.location.origin}/#access_token=${token}&type=signup&refresh_token=dummy`;
                window.open(url, '_blank');
                toast.success('Opening verification URL in new tab');
                setDebugInfo({ generatedUrl: url });
              }}
              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-xs"
            >
              Test Verification Link
            </button>
            
            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                      emailRedirectTo: window.location.origin,
                      data: { name }
                    }
                  });
                  
                  setDebugInfo({ signupResult: data, error });
                  
                  if (error) {
                    toast.error(`Signup error: ${error.message}`);
                  } else {
                    toast.success('Signup success! Check console for details');
                    console.log('Signup result:', data);
                  }
                } catch (err) {
                  console.error('Error in test signup:', err);
                  toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-white text-xs"
            >
              Test Signup
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                if (!email || !email.includes('@')) {
                  toast.error('Please enter a valid email address');
                  return;
                }
                
                setIsLoading(true);
                try {
                  const result = await forceVerifyUser(email);
                  setDebugInfo(result);
                  
                  if (result.success) {
                    toast.success(result.message);
                  } else {
                    toast.error(result.message);
                  }
                } catch (err) {
                  console.error('Error trying to force verify:', err);
                  toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs flex items-center justify-center"
            >
              <span role="img" aria-label="warning" className="mr-1">⚠️</span> Force Verify User (Admin Only)
            </button>
          </div>
        </div>
      )}
      
      {isLoading && <div className="text-xs text-gray-400">Loading...</div>}
      
      {debugInfo && (
        <div className="mt-2 text-xs">
          <div className="font-semibold border-b border-gray-700 pb-1 mb-1">Debug Info:</div>
          <pre className="whitespace-pre-wrap break-all bg-gray-900 p-1 rounded overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-400">
        Note: This panel only appears in development mode
      </div>
    </div>
  );
};
