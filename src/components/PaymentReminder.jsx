import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from './auth';

export default function PaymentReminder() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const notification = state && state.notification;

  const handlePay = () => {
    // This is a placeholder — integrate with your payments flow.
    alert('Proceeding to pay: ' + (notification?.amount || 'N/A'));
    navigate('/investments');
  };

  return (
    <div className="container" style={{ padding: 20 }}>
      <h2>Payment Reminder</h2>
      {notification ? (
        <div style={{ border: '1px solid #e5e7eb', padding: 16, borderRadius: 8 }}>
          <div style={{ fontWeight: 700 }}>{notification.title || 'Payment Due'}</div>
          <div style={{ marginTop: 8 }}>{notification.body || notification.message}</div>
          {notification.amount && <div style={{ marginTop: 8, fontWeight: 800 }}>Amount: ₹{notification.amount}</div>}
          <div style={{ marginTop: 12 }}>
            <button onClick={handlePay} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6 }}>Pay Now</button>
          </div>
        </div>
      ) : (
        <div>No reminder selected. Visit <a href="/investments">Investments</a> to manage payments.</div>
      )}
    </div>
  );
}
