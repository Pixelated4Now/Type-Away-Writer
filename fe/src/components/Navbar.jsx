import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BsBell, BsHeart, BsChevronDown, BsChat, BsChatDots, BsBookmark, BsStar, BsPerson, BsEnvelope, } from 'react-icons/bs';

import { GoHeartFill } from "react-icons/go";

import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import logo from '../assets/logoBase.png';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const notificationText = (n, accountType) => {
    const actor = n.actor_username || 'Someone';
    const title = n.story_title   || 'a story';
    switch (n.type) {
        case 'like':           return `${actor} liked ${title}`;
        case 'comment':        return `${actor} commented on ${title}`;
        case 'reply':          return `${actor} replied to your comment on ${title}`;
        case 'save':           return `${actor} added ${title} to a reading list`;
        case 'review':         return `Language expert ${actor} reviewed ${title}`;
        case 'follow':         return `${actor} started following you`;
        case 'review_request': return accountType === 'expert'
            ? 'You received a new review request'
            : `${actor} requested a review of ${title}`;
        default:               return 'You have a new notification';
    }
};

const NOTIF_ICONS = {
    like:           <BsHeart />,
    comment:        <BsChat />,
    reply:          <BsChatDots />,
    save:           <BsBookmark />,
    review:         <BsStar />,
    follow:         <BsPerson />,
    review_request: <BsEnvelope />,
};

const formatTime = (ts) =>
    new Date(ts).toLocaleString('en-US', {
        timeZone: 'Asia/Colombo',
        month:    'short',
        day:      'numeric',
        hour:     'numeric',
        minute:   '2-digit',
        hour12:   true,
    });

const Navbar = () => {
    const navigate         = useNavigate();
    const location         = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const [profileOpen,   setProfileOpen]   = useState(false);
    const [notifOpen,     setNotifOpen]     = useState(false);
    const [writeOpen,     setWriteOpen]     = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unread,        setUnread]        = useState(0);

    const profileRef = useRef(null);
    const notifRef   = useRef(null);
    const writeRef   = useRef(null);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('authToken');
        fetch(`${API}/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                setNotifications(data.notifications || []);
                setUnread(data.unread || 0);
            })
            .catch(() => {});
    }, [user]);

    const markRead = () => {
        const token = localStorage.getItem('authToken');
        fetch(`${API}/notifications/mark-read`, {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
        setUnread(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    // Close dropdowns on outside click; mark notifications read when notif dropdown closes
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(prev => {
                    if (prev) markRead();
                    return false;
                });
            }
            if (writeRef.current && !writeRef.current.contains(e.target)) {
                setWriteOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleNotif = () => {
        setNotifOpen(v => {
            if (v) markRead();
            return !v;
        });
        setProfileOpen(false);
    };

    const toggleProfile = () => {
        setProfileOpen(v => !v);
        setNotifOpen(false);
    };

    const handleLogout = () => {
        logout();
        setProfileOpen(false);
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">

                <div className="navbar-brand">
                    <Link to="/"><img src={logo} alt="TypeAway logo" className="navbar-logo" /></Link>
                </div>

                {user?.account_type === 'expert' ? (
                    <ul className="navbar-links">
                        <li><Link to="/"          className={isActive('/')          ? 'active' : ''}>Home</Link></li>
                        <li><Link to="/review"    className={isActive('/review')    ? 'active' : ''}>Review</Link></li>
                        <li><Link to="/read"      className={location.pathname.startsWith('/read') ? 'active' : ''}>Read</Link></li>
                        <li><Link to="/guidelines" className={isActive('/guidelines') ? 'active' : ''}>Guidelines</Link></li>
                    </ul>
                ) : (
                    <ul className="navbar-links">
                        <li><Link to="/"          className={isActive('/')                                ? 'active' : ''}>Home</Link></li>
                        <li ref={writeRef} className="write-nav-item">
                            <button
                                className={`write-nav-btn${location.pathname.startsWith('/write') ? ' active' : ''}`}
                                onClick={() => setWriteOpen(v => !v)}
                            >
                                Write
                            </button>
                            {writeOpen && (
                                <div className="write-dropdown">
                                    <div className="write-dropdown-item" onClick={() => { navigate('/write/new'); setWriteOpen(false); }}>
                                        Individual
                                    </div>
                                    <div className="write-dropdown-item write-dropdown-item-disabled">
                                        Collaboration
                                    </div>
                                </div>
                            )}
                        </li>
                        <li><Link to="/read"       className={location.pathname.startsWith('/read')       ? 'active' : ''}>Read</Link></li>
                        <li><Link to="/guidelines" className={isActive('/guidelines')                     ? 'active' : ''}>Guidelines</Link></li>
                    </ul>
                )}

                <div className="navbar-actions">
                    {!user ? (
                        <>
                            <button className="btn-signin" onClick={() => navigate('/login')}>Sign In</button>
                            <button className="btn-signup" onClick={() => navigate('/register')}>Sign Up</button>
                        </>
                    ) : (
                        <div className="navbar-user">

                            {/* Bell icon + notification dropdown */}
                            <div className="notif-wrap" ref={notifRef}>
                                <button className="btn-icon" onClick={toggleNotif} aria-label="Notifications">
                                    <BsBell />
                                    {unread > 0 && (
                                        <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>
                                    )}
                                </button>

                                {notifOpen && (
                                    <div className="dropdown notif-dropdown">
                                        <p className="dropdown-title">Notifications</p>
                                        {notifications.length === 0 ? (
                                            <p className="notif-empty">No notifications yet.</p>
                                        ) : (
                                            <ul className="notif-list">
                                                {notifications.map(n => (
                                                    <li
                                                        key={n.id}
                                                        className={`notif-item${!n.is_read ? ' unread' : ''}`}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => {
                                                            setNotifOpen(false);
                                                            markRead();
                                                            if (n.type === 'follow') {
                                                                navigate(`/profile/${n.actor_username}`);
                                                            } else if (n.type === 'review_request' && user?.account_type === 'expert') {
                                                                navigate('/review');
                                                            } else if (n.story_id) {
                                                                navigate(`/read/story/${n.story_id}`);
                                                            }
                                                        }}
                                                    >
                                                        <span className="notif-icon">
                                                            {NOTIF_ICONS[n.type] || <BsBell />}
                                                        </span>
                                                        <div className="notif-body">
                                                            <p className="notif-text">{notificationText(n, user?.account_type)}</p>
                                                            <span className="notif-time">{formatTime(n.created_at)}</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Avatar + chevron + profile dropdown */}
                            <div className="profile-wrap" ref={profileRef}>
                                <button className="btn-avatar" onClick={toggleProfile} aria-label="Profile menu">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API}${user.avatar_url}`} alt="avatar" className="avatar-img" />
                                    ) : (
                                        <span className="avatar-initials">{user.username[0].toUpperCase()}</span>
                                    )}
                                    <BsChevronDown className={`chevron${profileOpen ? ' open' : ''}`} />
                                </button>

                                {profileOpen && (
                                    <div className="dropdown profile-dropdown">
                                        <Link
                                            to={`/profile/${user.username}`}
                                            className="dropdown-item"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            My Profile
                                        </Link>
                                        <Link
                                            to="/account-settings"
                                            className="dropdown-item"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            Account Settings
                                        </Link>
                                        <div className="dropdown-divider" />
                                        <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>

            </div>
        </nav>
    );
};

export default Navbar;
