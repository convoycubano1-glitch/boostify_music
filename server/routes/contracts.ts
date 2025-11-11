import { Router, Request } from 'express';
import { db } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { generateContract, analyzeContract, generateTemplateContract, CONTRACT_TEMPLATES } from '../services/gemini-contracts';

interface AuthRequest extends Request {
  isAuthenticated(): boolean;
  user?: {
    uid: string;
    email: string;
  };
}

const router = Router();

const generateContractSchema = z.object({
  contractType: z.string().min(2),
  artistName: z.string().min(2),
  clientName: z.string().optional(),
  projectDetails: z.string().optional(),
  paymentTerms: z.string().optional(),
  duration: z.string().optional(),
  additionalClauses: z.string().optional(),
});

const saveContractSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(10),
  contractType: z.string().optional(),
  status: z.enum(['draft', 'active', 'signed', 'expired']).optional(),
});

router.post('/generate', async (req: any, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const validationResult = generateContractSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.format()
      });
    }

    const contractContent = await generateContract(validationResult.data);

    return res.status(200).json({
      success: true,
      content: contractContent
    });

  } catch (error: any) {
    console.error('Error generating contract:', error);
    return res.status(500).json({ 
      error: 'Failed to generate contract',
      details: error.message 
    });
  }
});

router.post('/analyze', async (req: any, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { contractText } = req.body;

    if (!contractText || typeof contractText !== 'string') {
      return res.status(400).json({ error: 'Contract text is required' });
    }

    const analysis = await analyzeContract(contractText);

    return res.status(200).json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('Error analyzing contract:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze contract',
      details: error.message 
    });
  }
});

router.get('/templates', async (req, res) => {
  return res.status(200).json({
    success: true,
    templates: CONTRACT_TEMPLATES
  });
});

router.post('/generate-template', async (req: any, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { templateType, customParams } = req.body;

    if (!templateType) {
      return res.status(400).json({ error: 'Template type is required' });
    }

    const contractContent = await generateTemplateContract(templateType, customParams || {});

    return res.status(200).json({
      success: true,
      content: contractContent
    });

  } catch (error: any) {
    console.error('Error generating template contract:', error);
    return res.status(500).json({ 
      error: 'Failed to generate template contract',
      details: error.message 
    });
  }
});

router.post('/', async (req: any, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const validationResult = saveContractSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.format()
      });
    }

    const userId = req.user.uid;
    const contractData = {
      ...validationResult.data,
      userId,
      status: validationResult.data.status || 'draft',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('contracts').add(contractData);

    return res.status(201).json({
      success: true,
      id: docRef.id,
      message: 'Contract saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving contract:', error);
    return res.status(500).json({ 
      error: 'Failed to save contract',
      details: error.message 
    });
  }
});

router.get('/', async (req: any, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userId = req.user.uid;

    const contractsSnapshot = await db.collection('contracts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const contracts = contractsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      contracts
    });

  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch contracts',
      details: error.message 
    });
  }
});

router.get('/:id', async (req: any, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const contractDoc = await db.collection('contracts').doc(id).get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    if (contractData?.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json({
      success: true,
      contract: {
        id: contractDoc.id,
        ...contractData
      }
    });

  } catch (error: any) {
    console.error('Error fetching contract:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch contract',
      details: error.message 
    });
  }
});

router.patch('/:id', async (req: any, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const contractDoc = await db.collection('contracts').doc(id).get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    if (contractData?.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {
      ...req.body,
      updatedAt: FieldValue.serverTimestamp()
    };

    delete updates.userId;
    delete updates.createdAt;

    await contractDoc.ref.update(updates);

    return res.status(200).json({
      success: true,
      message: 'Contract updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating contract:', error);
    return res.status(500).json({ 
      error: 'Failed to update contract',
      details: error.message 
    });
  }
});

router.delete('/:id', async (req: any, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const contractDoc = await db.collection('contracts').doc(id).get();

    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractData = contractDoc.data();

    if (contractData?.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await contractDoc.ref.delete();

    return res.status(200).json({
      success: true,
      message: 'Contract deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting contract:', error);
    return res.status(500).json({ 
      error: 'Failed to delete contract',
      details: error.message 
    });
  }
});

export default router;
