import mongoose, { Schema } from 'mongoose';
import { collectionName } from '../Data/schema';

const healthSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: collectionName.Patient,
        required: true
    },
    heartRate: {
        type: Number,
        required: true
    },
    temperature: {
        type: Number,
        required: true
    },
    bloodPressure: {
        type: Number,
        required: true
    },
    glucose: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    medicalHistory: [{
        type: Schema.Types.ObjectId,
        ref: collectionName.Diseases
    }]
})

const Health = mongoose.model(collectionName.Health, healthSchema);

export default Health;