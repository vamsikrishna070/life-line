import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let firebaseInitialized = false;

try {
  // Check if service account file path is provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.log('⚠️  Firebase service account file not found at:', serviceAccountPath);
    }
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    // Fallback to individual environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized from env variables');
  } else {
    console.log('⚠️  Firebase credentials not configured - Push notifications disabled');
  }
} catch (error) {
  console.log('⚠️  Firebase initialization error:', error.message);
}

export const sendEmergencyNotification = async (donors, request) => {
  try {
    if (!firebaseInitialized) {
      console.log('⚠️  Firebase not configured - Skipping push notifications');
      return;
    }

    const messaging = admin.messaging();

    // Filter donors with FCM tokens
    const tokensToSend = donors
      .filter(donor => donor.fcmToken)
      .map(donor => donor.fcmToken);

    if (tokensToSend.length === 0) {
      console.log('No donors with FCM tokens found');
      return;
    }

    const message = {
      notification: {
        title: `🚨 Emergency: ${request.bloodGroup} Blood Needed!`,
        body: `${request.patientName} needs ${request.bloodGroup} blood at ${request.hospitalName}, ${request.location.city}. Urgency: ${request.urgency}`,
      },
      data: {
        requestId: request._id.toString(),
        bloodGroup: request.bloodGroup,
        city: request.location.city,
        urgency: request.urgency,
        type: 'emergency_request'
      },
      tokens: tokensToSend
    };

    const response = await messaging.sendMulticast(message);
    
    console.log(`✅ Sent ${response.successCount} notifications successfully`);
    if (response.failureCount > 0) {
      console.log(`❌ ${response.failureCount} notifications failed`);
    }

    return response;
  } catch (error) {
    console.error('Error sending notifications:', error.message);
    return null;
  }
};

export const sendVerificationNotification = async (donor) => {
  try {
    if (!firebaseInitialized || !donor.fcmToken) {
      return;
    }

    const messaging = admin.messaging();

    const message = {
      notification: {
        title: '✅ Account Verified!',
        body: 'Your LifeLine donor account has been verified. You can now respond to blood requests.',
      },
      token: donor.fcmToken
    };

    await messaging.send(message);
    console.log(`✅ Verification notification sent to ${donor.name}`);
  } catch (error) {
    console.error('Error sending verification notification:', error.message);
  }
};

export const sendRequestResponseNotification = async (requester, donor, request) => {
  try {
    if (!firebaseInitialized || !requester.fcmToken) {
      return;
    }

    const messaging = admin.messaging();
    
    const message = {
      notification: {
        title: '💖 Donor Response!',
        body: `${donor.name} (${donor.bloodGroup}) has responded to your blood request for ${request.location.city}.`,
      },
      data: {
        requestId: request._id.toString(),
        donorId: donor._id.toString(),
        type: 'donor_response'
      },
      token: requester.fcmToken
    };

    await messaging.send(message);
    console.log(`✅ Response notification sent to requester`);
  } catch (error) {
    console.error('Error sending response notification:', error.message);
  }
};
