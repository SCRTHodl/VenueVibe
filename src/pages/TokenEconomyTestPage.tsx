import React from 'react';
import TokenEconomyTest from '../components/TokenEconomyTest';

const TokenEconomyTestPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Token Economy Migration Test</h1>
      <p className="mb-4">
        This page tests the successful migration of token economy tables to the public schema with the te_ prefix.
      </p>
      
      <TokenEconomyTest />
    </div>
  );
};

export default TokenEconomyTestPage;
