import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
}

const UserSchema = new Schema<IUser>(
    {
        uid: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Users = mongoose.models.Users || mongoose.model<IUser>('Users', UserSchema);

export { Users };
