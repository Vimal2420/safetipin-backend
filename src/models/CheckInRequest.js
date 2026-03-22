import mongoose from 'mongoose';

const checkInRequestSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TravelSession',
      required: true,
    },
    trustedContactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'missed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const CheckInRequest = mongoose.model('CheckInRequest', checkInRequestSchema);

export default CheckInRequest;
