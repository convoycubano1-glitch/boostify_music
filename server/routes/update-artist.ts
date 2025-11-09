import { Router } from 'express';
import { db as firestore, storage } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const router = Router();

router.post('/update-profile', async (req, res) => {
  try {
    const { userId, profileData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userRef = firestore.collection('artists').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        ...profileData,
        updatedAt: new Date(),
      });
    } else {
      await userRef.update({
        ...profileData,
        updatedAt: new Date(),
      });
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/upload-profile-image', async (req, res) => {
  try {
    const { userId, imageData } = req.body;
    
    if (!userId || !imageData) {
      return res.status(400).json({ error: 'User ID and image data are required' });
    }

    const storageRef = ref(storage, `artist_profiles/${userId}/profile_${Date.now()}.png`);
    await uploadString(storageRef, imageData, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);

    const userRef = firestore.collection('artists').doc(userId);
    await userRef.update({
      profileImage: downloadURL,
      updatedAt: new Date(),
    });

    res.json({ success: true, imageUrl: downloadURL });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.post('/upload-banner-image', async (req, res) => {
  try {
    const { userId, imageData } = req.body;
    
    if (!userId || !imageData) {
      return res.status(400).json({ error: 'User ID and image data are required' });
    }

    const storageRef = ref(storage, `artist_profiles/${userId}/banner_${Date.now()}.png`);
    await uploadString(storageRef, imageData, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);

    const userRef = firestore.collection('artists').doc(userId);
    await userRef.update({
      bannerImage: downloadURL,
      updatedAt: new Date(),
    });

    res.json({ success: true, imageUrl: downloadURL });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ error: 'Failed to upload banner' });
  }
});

router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userRef = firestore.collection('artists').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.json({
        name: 'Artist Name',
        biography: 'Biography not available',
        genre: 'Genre not specified',
        location: 'Location not specified',
        profileImage: '',
        bannerImage: '',
      });
    }

    res.json(userDoc.data());
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
