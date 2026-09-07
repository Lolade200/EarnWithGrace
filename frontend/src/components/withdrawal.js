import React, { useState } from 'react';

const Withdrawal = () => {
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('058');
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Defined function
  const handleGPWithdrawal = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://earnwithgrace-payouts.onrender.com/api/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: bankCode,
          amount: Number(amount),
          name: accountName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Withdrawal request initiated successfully!');
      } else {
        alert(`Withdrawal failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Withdraw GP</h2>
      {/* 2. Used here in onSubmit — this removes the warning */}
      <form onSubmit={handleGPWithdrawal}> 
        <input 
          type="text" 
          placeholder="Account Name" 
          value={accountName} 
          onChange={(e) => setAccountName(e.target.value)} 
          required 
        />
        <input 
          type="text" 
          placeholder="Account Number" 
          value={accountNumber} 
          onChange={(e) => setAccountNumber(e.target.value)} 
          required 
        />
        <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
          <option value="058">GTBank</option>
          <option value="011">First Bank</option>
          <option value="057">Zenith Bank</option>
          <option value="100004">OPay</option>
        </select>
        <input 
          type="number" 
          placeholder="Amount (NGN)" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          required 
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Withdraw'}
        </button>
      </form>
    </div>
  );
};

export default Withdrawal;