import { Timestamp } from "firebase/firestore";

export interface Draw {
  id?: string;
  date_tirage: string;
  nom_tirage: string;
  gagnants: number[];
  machine: number[];
  timestamp: Timestamp | string;
  sort_key?: number;
}

export interface Prediction {
  id?: string;
  userId: string;
  numbers: number[]; // generally used for PERM 5
  banker?: number;
  nap2?: number[];
  nap3?: number[];
  drawType: string;
  method: string;
  timestamp: Timestamp | string;
  matches?: {
    drawId: string;
    drawDate: string;
    drawName: string;
    matchedNumbers: number[];
    count: number;
  }[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
