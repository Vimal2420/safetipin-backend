import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
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

// @desc    Direct Password Login (Used by Police, and as step 1 for others)
// @route   POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { phone: identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Identifier and password are required' });
        }

        let query = [
            { phone: identifier },
            { username: identifier },
            { email: identifier }
        ];

        if (/^\d{10}$/.test(identifier)) {
            query.push({ phone: `+91${identifier}` });
        }

        const user = await User.findOne({ $or: query }).select('+passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // If user is volunteer and not approved
        if (user.role === 'volunteer' && !user.isApproved) {
            return res.status(403).json({ 
                message: 'Your account is pending authority approval.',
                isPendingApproval: true 
            });
        }

        res.status(200).json({
            message: 'Login successful',
            _id: user._id,
            userId: user.userId,
            name: user.name,
            username: user.username,
            gender: user.gender,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
