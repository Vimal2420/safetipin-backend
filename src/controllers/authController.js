import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Authority from '../models/Authority.js';
import Volunteer from '../models/Volunteer.js';
import { sendSMS } from '../utils/mail.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a new user (Direct)
// @route   POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { userData } = req.body;

        if (!userData || !userData.phone || !userData.name || !userData.password) {
            return res.status(400).json({ message: 'Missing required registration fields' });
        }

        const identifier = userData.phone.startsWith('+') ? userData.phone : `+91${userData.phone}`;

        // Check for existing user
        const existingUser = await User.findOne({ 
            $or: [
                { phone: identifier },
                { username: userData.username },
                { email: userData.email }
            ].filter(q => q.username || q.email || q.phone)
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User with this phone/email/username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(userData.password, salt);

        // Automate username if missing: name + random 4-digit number
        const username = userData.username || `${userData.name.toLowerCase().replace(/\s+/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;

        const user = new User({
            ...userData,
            phone: identifier,
            username,
            passwordHash,
            isVerified: true,
            isPhoneVerified: true,
            isApproved: userData.role === 'volunteer' ? false : true
        });

        await user.save();

        console.log(`[AUTH] New registration: ${user.phone} (${user.role})`);

        if (user.role === 'volunteer' && !user.isApproved) {
            return res.status(201).json({
                message: 'Registration successful. Pending approval.',
                isPendingApproval: true,
                _id: user._id,
                name: user.name,
                role: user.role
            });
        }

        res.status(201).json({
            message: 'Registration successful',
            _id: user._id,
            name: user.name,
            username: user.username,
            phone: user.phone,
            role: user.role,
            gender: user.gender,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('[AUTH ERROR] Register failed:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Deprecated OTP functions
export const sendOtp = async (req, res) => res.status(200).json({ message: 'OTP disabled. Use login/register.' });
export const verifyOtp = async (req, res) => res.status(200).json({ message: 'OTP disabled. Use login/register.' });

// @desc    Direct Password Login (Police, Volunteers, Users)
// @route   POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { phone: identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Identifier and password are required' });
        }

        // Build multi-field query (phone, username, email)
        let query = [
            { phone: identifier },
            { username: identifier },
            { email: identifier }
        ];

        // If bare 10-digit number, also try with +91 prefix
        if (/^\d{10}$/.test(identifier)) {
            query.push({ phone: `+91${identifier}` });
        }

        // 1. Try regular User collection
        let account = await User.findOne({ $or: query }).select('+passwordHash');
        let role = account?.role || 'user';

        // 2. If not found, try Volunteer collection
        if (!account) {
            account = await Volunteer.findOne({ $or: query }).select('+passwordHash');
            if (account) role = 'volunteer';
        }

        // 3. If not found, try Authority (Police) collection
        if (!account) {
            account = await Authority.findOne({ $or: query }).select('+passwordHash');
            if (account) role = 'authority';
        }

        if (!account) {
            console.log(`[AUTH] Login failed: No account for "${identifier}"`);
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, account.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // If volunteer and not approved
        if (role === 'volunteer' && !account.isApproved) {
            return res.status(403).json({ 
                message: 'Your account is pending authority approval.',
                isPendingApproval: true 
            });
        }

        console.log(`[AUTH] Login success: ${account.phone} (${role})`);

        res.status(200).json({
            message: 'Login successful',
            _id: account._id,
            userId: account.userId,
            name: account.name,
            username: account.username,
            gender: account.gender,
            phone: account.phone,
            role: role,
            token: generateToken(account._id),
        });

    } catch (error) {
        console.error('[AUTH ERROR] Login failed:', error.message);
        res.status(500).json({ message: error.message });
    }
};
