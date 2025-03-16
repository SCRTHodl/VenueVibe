import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TokenEconomyTest: React.FC = () => {
  const [promotionSettings, setPromotionSettings] = useState<any>(null);
  const [tokenBalances, setTokenBalances] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTokenEconomyData() {
      try {
        // Test access to promotion settings table (public schema with te_ prefix)
        const { data: settings, error: settingsError } = await supabase
          .from('te_promotion_settings')
          .select('*')
          .limit(1);

        if (settingsError) {
          console.error('Error fetching promotion settings:', settingsError);
          setErrorMessage(`Error fetching promotion settings: ${settingsError.message}`);
        } else {
          setPromotionSettings(settings && settings.length > 0 ? settings[0] : null);
        }

        // Test access to user token balances (public schema with te_ prefix)
        const { data: balances, error: balancesError } = await supabase
          .from('te_user_token_balances')
          .select('*')
          .limit(5);

        if (balancesError) {
          console.error('Error fetching token balances:', balancesError);
          setErrorMessage(`Error fetching token balances: ${balancesError.message}`);
        } else {
          setTokenBalances(balances || []);
        }

      } catch (error) {
        console.error('Unexpected error:', error);
        setErrorMessage(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    }

    fetchTokenEconomyData();
  }, []);

  // Function to grant tokens to a user (test the RPC function)
  const grantTokens = async () => {
    try {
      const { data, error } = await supabase.rpc('grant_free_refresh_tokens', {
        p_user_id: 'test-user-id',
        p_token_count: 10
      });

      if (error) {
        console.error('Error granting tokens:', error);
        setErrorMessage(`Error granting tokens: ${error.message}`);
      } else {
        alert('Successfully granted tokens!');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setErrorMessage(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (loading) {
    return <div className="p-4">Loading token economy data...</div>;
  }

  return (
    <div className="p-4 space-y-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Token Economy Test (Public Schema)</h2>
      
      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold">Promotion Settings (te_promotion_settings)</h3>
        <div className="mt-2 p-3 bg-gray-100 rounded-md overflow-auto">
          <pre>{JSON.stringify(promotionSettings, null, 2)}</pre>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold">User Token Balances (te_user_token_balances)</h3>
        <div className="mt-2 p-3 bg-gray-100 rounded-md overflow-auto">
          <pre>{JSON.stringify(tokenBalances, null, 2)}</pre>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold">Test RPC Function</h3>
        <button 
          onClick={grantTokens}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Grant 10 Tokens to Test User
        </button>
      </div>
    </div>
  );
};

export default TokenEconomyTest;
