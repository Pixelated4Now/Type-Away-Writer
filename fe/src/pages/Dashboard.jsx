import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate         = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <h1>Welcome, {user?.username}!</h1>
            <p>Account type: <strong>{user?.account_type}</strong></p>
            <p style={{ color: '#666', marginTop: '24px' }}>
                Dashboard is under construction — more features coming soon.
            </p>
            <button onClick={handleLogout} style={{ marginTop: '32px', padding: '10px 24px', cursor: 'pointer' }}>
                Log out
            </button>
        </div>
    );
};

export default Dashboard;
