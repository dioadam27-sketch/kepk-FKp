/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'RESEARCHER' | 'REVIEWER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  name: string;
  profile?: {
    placeOfBirth: string;
    dateOfBirth: string;
    gender: string;
    lastEducation: string;
    status: string; // D3, D4, S1, S2, S3, Dosen/Umum
    institution: string;
    phone: string;
  };
}

export type ProtocolStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'ASSIGNED' 
  | 'REVIEWING' 
  | 'REVISION_REQUIRED' 
  | 'APPROVED' 
  | 'REJECTED';

export type ReviewClassification = 
  | 'CONTINUING' 
  | 'EXEMPT' 
  | 'EXPEDITED' 
  | 'FULLBOARD';

export interface Protocol {
  id: string;
  researcherId: string;
  registrationNumber: string;
  title: string;
  status: ProtocolStatus;
  classification?: ReviewClassification;
  submittedAt?: string;
  
  // Section A: General Info
  generalInfo: {
    mainResearcher: string;
    phone: string;
    members: string;
    organizingInstitution: string;
    collaborationType: string;
    collaborationDetails?: string; // Number of countries, other details, etc.
    researchTeamTasks: { name: string; institution: string; task: string; contact: string }[];
    design: string;
    designDetails?: string; // Specify if Other or Qualitative details
    location: string;
    time: string;
    dataCollectionTime: string;
    previousSubmission: string; // 'Ya', 'Tidak'
    previousSubmissionResult?: string; // 'diterima', 'ditolak'
  };

  // Section B: Screening (The 48 items)
  screening: Record<string, string>;

  // Attachments
  attachments: {
    proposal: string; // URL or filename
    psp: string;
    ic: string;
    instruments: string;
    supportingDocs: string[];
    paymentProof: string;
  };

  // Review Info
  assignedReviewers: string[]; // Reviewer IDs
  reviews: Review[];
  revisions: Revision[];
}

export interface Review {
  reviewerId: string;
  reviewerName: string;
  assignedAt: string;
  submittedAt?: string;
  reviewFile?: string;
  conclusion?: 'APPROVED' | 'CONDITIONAL' | 'ADDITIONAL_INFO' | 'REJECTED';
  notes?: string;
}

export interface Revision {
  submittedAt: string;
  protocolFile: string;
  attachments: string[];
}

export interface Report {
  id: string;
  protocolId: string;
  type: 'PROGRESS' | 'FINAL' | 'AMENDMENT';
  submittedAt: string;
  file: string;
  status: 'SUBMITTED' | 'APPROVED';
}
