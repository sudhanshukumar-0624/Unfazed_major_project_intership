import { CreditCard } from 'lucide-react';

const Payment = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="card text-center" style={{ maxWidth: 400, padding: 32 }}>
      <CreditCard size={48} color="var(--accent-indigo)" style={{ margin: '0 auto 16px' }} />
      <h2>Complete Payment</h2>
      <p className="text-muted" style={{ marginTop: 8 }}>Secure payment powered by Razorpay.</p>
      <button className="btn btn-primary mt-4" style={{ background: 'linear-gradient(135deg,#2dce89,#26af74)' }}>
        Pay Now
      </button>
    </div>
  </div>
);
export default Payment;
