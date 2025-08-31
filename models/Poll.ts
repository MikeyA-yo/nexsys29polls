import mongoose from 'mongoose';

export interface IPoll extends mongoose.Document {
  _id: string;
  question: string;
  options: string[];
  votes: number[];
  passwordHash: string;
  createdAt: Date;
}

const PollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length >= 2;
      },
      message: 'A poll must have at least 2 options'
    }
  },
  votes: {
    type: [Number],
    default: [],
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Initialize votes array with zeros when options are set
PollSchema.pre('save', function(next) {
  if (this.isNew && this.options && this.votes.length === 0) {
    this.votes = new Array(this.options.length).fill(0);
  }
  next();
});

export default mongoose.models.Poll || mongoose.model<IPoll>('Poll', PollSchema);
