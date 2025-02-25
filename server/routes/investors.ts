import { Router } from 'express';
import { db } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const router = Router();

// Validation schema for investor registration
const investorSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  phone: z.string().optional(),
  country: z.string().min(2, { message: "Country is required" }),
  investmentAmount: z.number().min(1, { message: "Investment amount is required" }),
  investorType: z.enum(["individual", "corporate", "institutional"]),
  riskTolerance: z.enum(["low", "medium", "high"]),
  investmentGoals: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
});

type InvestorData = z.infer<typeof investorSchema>;

// Route to register a new investor
router.post('/register', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Validate the request body
    const validationResult = investorSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.format()
      });
    }
    
    const investorData: InvestorData & { userId: string, status: string, createdAt: any } = {
      ...validationResult.data,
      userId: req.user.uid,
      status: "pending",
      createdAt: serverTimestamp()
    };
    
    // Use Firebase Admin SDK to add document
    const docRef = await db.collection('investors').add(investorData);
    
    console.log("New investor registered with ID:", docRef.id);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Investor registration successful',
      id: docRef.id
    });
    
  } catch (error) {
    console.error('Error registering investor:', error);
    return res.status(500).json({ 
      error: 'Failed to register investor',
      details: error.message
    });
  }
});

export default router;