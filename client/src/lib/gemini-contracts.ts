import axios from 'axios';

export interface ContractTemplate {
  title: string;
  description: string;
  type: string;
}

export interface ContractAnalysis {
  summary: string;
  risks: string[];
  recommendations: string[];
  keyTerms: { term: string; description: string }[];
}

export interface Contract {
  id: string;
  title: string;
  content: string;
  contractType?: string;
  status: 'draft' | 'active' | 'signed' | 'expired';
  createdAt: any;
  updatedAt: any;
  userId: string;
}

export async function generateContract(params: {
  contractType: string;
  artistName: string;
  clientName?: string;
  projectDetails?: string;
  paymentTerms?: string;
  duration?: string;
  additionalClauses?: string;
}): Promise<string> {
  const response = await axios.post('/api/contracts/generate', params);
  return response.data.content;
}

export async function analyzeContract(contractText: string): Promise<ContractAnalysis> {
  const response = await axios.post('/api/contracts/analyze', { contractText });
  return response.data.analysis;
}

export async function getContractTemplates(): Promise<Record<string, ContractTemplate>> {
  const response = await axios.get('/api/contracts/templates');
  return response.data.templates;
}

export async function generateFromTemplate(
  templateType: string,
  customParams: Record<string, string>
): Promise<string> {
  const response = await axios.post('/api/contracts/generate-template', {
    templateType,
    customParams
  });
  return response.data.content;
}

export async function saveContract(data: {
  title: string;
  content: string;
  contractType?: string;
  status?: 'draft' | 'active' | 'signed' | 'expired';
}): Promise<{ id: string }> {
  const response = await axios.post('/api/contracts', data);
  return { id: response.data.id };
}

export async function getUserContracts(): Promise<Contract[]> {
  const response = await axios.get('/api/contracts');
  return response.data.contracts;
}

export async function getContract(id: string): Promise<Contract> {
  const response = await axios.get(`/api/contracts/${id}`);
  return response.data.contract;
}

export async function updateContract(id: string, data: Partial<Contract>): Promise<void> {
  await axios.patch(`/api/contracts/${id}`, data);
}

export async function deleteContract(id: string): Promise<void> {
  await axios.delete(`/api/contracts/${id}`);
}
