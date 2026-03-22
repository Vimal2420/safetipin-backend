import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Destination from '../models/Destination.js';
import Resource from '../models/Resource.js';
import Alert from '../models/Alert.js';
import Message from '../models/Message.js';
import Incident from '../models/Incident.js';
import GuardingSession from '../models/guarding/GuardingSession.js';
import LocationUpdate from '../models/guarding/LocationUpdate.js';
import CheckInRequest from '../models/CheckInRequest.js';
import TravelSession from '../models/TravelSession.js';

const seedDatabase = async () => {
  try {
    // 1. Clear existing data to ensure consistency with PROJECT_STATUS.txt
    console.log('🗑️ Synchronizing database with project credentials...');
    console.log('  Deleting Users...');
    await User.deleteMany({});
    console.log('  Deleting Alerts...');
    await Alert.deleteMany({});
    console.log('  Deleting Messages...');
    await Message.deleteMany({});
    console.log('  Deleting Destinations...');
    await Destination.deleteMany({});
    console.log('  Deleting Incidents...');
    await Incident.deleteMany({});
    console.log('  Deleting Resources...');
    await Resource.deleteMany({}); // Always refresh resources to ensure helplines are present
    console.log('  Deleting GuardingSessions...');
    await GuardingSession.deleteMany({});
    console.log('  Deleting LocationUpdates...');
    await LocationUpdate.deleteMany({});
    console.log('  Deleting CheckInRequests...');
    await CheckInRequest.deleteMany({});
    console.log('  Deleting TravelSessions...');
    await TravelSession.deleteMany({});
    console.log('🧹 Cleanup complete. Seeding new data...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 2. Generate 5 Users (Exact match to PROJECT_STATUS.txt)
    const usersData = [
      {
        name: 'Ananya Roy',
        username: 'ananya_female',
        phone: '+919112223344',
        email: 'ananya@demo.com',
        passwordHash,
        gender: 'female',
        role: 'user',
        isVerified: true,
        currentLocation: { type: 'Point', coordinates: [76.2999, 9.9816] },
        trustedContacts: [{ name: 'Sujata Roy', phone: '+919999999991', relation: 'Family' }]
      },
      {
        name: 'Priya Sharma',
        username: 'priya_female',
        phone: '+919112223355',
        email: 'priya@demo.com',
        passwordHash,
        gender: 'female',
        role: 'user',
        isVerified: true,
        currentLocation: { type: 'Point', coordinates: [76.3066, 10.0249] },
        trustedContacts: [{ name: 'Ananya Roy', phone: '+919112223344', relation: 'Friend' }]
      },
      {
        name: 'Rohan Mehta',
        username: 'rohan_male',
        phone: '+919223334466',
        email: 'rohan@demo.com',
        passwordHash,
        gender: 'male',
        role: 'user',
        isVerified: true,
        currentLocation: { type: 'Point', coordinates: [76.3195, 9.9472] },
        trustedContacts: [{ name: 'Ananya Roy', phone: '+919112223344', relation: 'Sister' }]
      },
      {
        name: 'Rahul Kumar',
        username: 'rahul_volunteer',
        phone: '+919998887776',
        email: 'volunteer@demo.com',
        passwordHash,
        gender: 'male',
        role: 'volunteer',
        isVerified: true,
        isApproved: false,
        address: 'Fort Kochi Beach Road',
        currentLocation: { type: 'Point', coordinates: [76.2421, 9.9658] }
      },
      {
        name: 'Officer Suresh',
        username: 'suresh_police',
        phone: '+911111111111',
        email: 'police@demo.com',
        passwordHash,
        gender: 'male',
        role: 'authority',
        isVerified: true,
        department: 'Central Police Station',
        badgeNumber: 'POL-12345',
        currentLocation: { type: 'Point', coordinates: [76.2825, 9.9785] }
      }
    ];

    const users = await User.insertMany(usersData);
    const ananya = users[0];

    // 3. Resources (Guides + Helplines) - No Mock Safe Havens
    const resources = [
      // GUIDES
      { title: 'Self Defense Basics', type: 'guide', category: 'Tutorial', description: 'Essential protection moves.', duration: '6 mins', url: 'https://youtube.com/watch?v=sample1', icon: 'fitness_center', color: '#FFF1F2', iconColor: '#E11D48' },
      { title: 'Using SOS Features', type: 'guide', category: 'App Guide', description: 'Voice and volume triggers.', duration: '4 mins', url: 'https://youtube.com/watch?v=sample2', icon: 'security', color: '#F0F9FF', iconColor: '#0369A1' },
      { title: 'Digital Safety Tips', type: 'guide', category: 'Safety', description: 'Privacy and data protection.', duration: '8 mins', url: 'https://youtube.com/watch?v=sample3', icon: 'phonelink_lock', color: '#F0FDF4', iconColor: '#16A34A' },
      { title: 'Safe Travel Handbook', type: 'guide', category: 'Travel', description: 'Night travel best practices.', duration: '10 mins', url: 'https://youtube.com/watch?v=sample4', icon: 'directions_walk', color: '#FFF7ED', iconColor: '#EA580C' },
      { title: 'Women\'s Legal Rights', type: 'guide', category: 'Legal', description: 'Legal protections in India.', duration: '12 mins', url: 'https://youtube.com/watch?v=sample5', icon: 'gavel', color: '#F5F3FF', iconColor: '#7C3AED' },
      { title: 'Visual Awareness', type: 'guide', category: 'Safety', description: 'Spotting threats early.', duration: '5 mins', url: 'https://youtube.com/watch?v=sample6', icon: 'visibility', color: '#ECFEFF', iconColor: '#0891B2' },
      { title: 'Volunteer Best Practices', type: 'guide', category: 'Community', description: 'Responding to alerts.', duration: '7 mins', url: 'https://youtube.com/watch?v=sample7', icon: 'groups', color: '#FDF2F8', iconColor: '#DB2777' },
      { title: 'Emergency Contact Setup', type: 'guide', category: 'App Guide', description: 'Trusted contact setup.', duration: '3 mins', url: 'https://youtube.com/watch?v=sample8', icon: 'contact_phone', color: '#F1F5F9', iconColor: '#475569' },
      
      // HELPLINES
      { title: 'National Emergency', phone: '112', type: 'helpline', category: 'Emergency', description: 'Police, Fire, Ambulance', icon: 'contact_phone', color: '#F0FDF4', iconColor: '#16A34A' },
      { title: 'Women Helpline', phone: '1091', type: 'helpline', category: 'Safety', description: 'Women in distress', icon: 'contact_phone', color: '#FFF1F2', iconColor: '#E11D48' },
      { title: 'Women in Distress', phone: '181', type: 'helpline', category: 'Safety', description: 'Support and info', icon: 'contact_phone', color: '#FFF1F2', iconColor: '#E11D48' },
      { title: 'Cyber Crime Cell', phone: '1930', type: 'helpline', category: 'Digital', description: 'Online harassment', icon: 'phonelink_lock', color: '#F0F9FF', iconColor: '#0369A1' },
      { title: 'Anti-Ragging', phone: '1800-180-5522', type: 'helpline', category: 'Students', description: 'Institution harassment', icon: 'gavel', color: '#F5F3FF', iconColor: '#7C3AED' }
    ];
    await Resource.insertMany(resources);

    // 4. Populate TrustedContact Collection (For Dashboard Logic)
    const TrustedContact = (await import('../models/TrustedContact.js')).default;
    await TrustedContact.deleteMany({});
    
    // Ananya's ID is used as she is the primary trusted contact in PROJECT_STATUS.txt
    const trustedLinks = [
      // Priya monitors Ananya
      { ownerUserId: ananya._id, trustedUserId: users[1]._id, relationship: 'Friend' },
      // Rohan monitors Ananya
      { ownerUserId: ananya._id, trustedUserId: users[2]._id, relationship: 'Sister' },
      // Ananya monitors Priya
      { ownerUserId: users[1]._id, trustedUserId: ananya._id, relationship: 'Friend' },
      // Ananya monitors Rohan
      { ownerUserId: users[2]._id, trustedUserId: ananya._id, relationship: 'Brother' }
    ];
    await TrustedContact.insertMany(trustedLinks);

    console.log('✅ Database successfully synchronized with Production-ready data!');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
  }
};

export default seedDatabase;
