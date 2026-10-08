import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId as specified in SKILL.md
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on startup
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or checking connection.');
    }
  }
}

// Service: Save photobooth photo to Firestore
export async function savePhotoToFirestore(photoData: {
  id: string;
  dataUrl: string;
  collageType: string;
  templateName: string;
  createdAt: string;
}): Promise<boolean> {
  const path = `photos/${photoData.id}`;
  try {
    const photoRef = doc(db, 'photos', photoData.id);
    await setDoc(photoRef, photoData);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return false;
  }
}

// Service: Get photobooth photo from Firestore
export async function getPhotoFromFirestore(photoId: string): Promise<DocumentData | null> {
  const path = `photos/${photoId}`;
  try {
    const photoRef = doc(db, 'photos', photoId);
    const snap = await getDoc(photoRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Service: Real-time listener for photobooth photo (instant sync when scanned on mobile)
export function subscribeToPhotoFromFirestore(
  photoId: string,
  onData: (data: DocumentData | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = `photos/${photoId}`;
  const photoRef = doc(db, 'photos', photoId);
  return onSnapshot(
    photoRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data());
      } else {
        onData(null);
      }
    },
    (error) => {
      console.warn('Real-time photo subscription notice:', error);
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  );
}

// Service: Save custom frame template to Firestore
export async function saveTemplateToFirestore(templateData: {
  id: string;
  title: string;
  dataUrl: string;
  collageType: string;
  createdAt: string;
}): Promise<boolean> {
  const path = `templates/${templateData.id}`;
  try {
    const templateRef = doc(db, 'templates', templateData.id);
    await setDoc(templateRef, templateData);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Service: Get custom frame template from Firestore (e.g. plesir_strip)
export async function getTemplateFromFirestore(templateId: string): Promise<DocumentData | null> {
  const path = `templates/${templateId}`;
  try {
    const templateRef = doc(db, 'templates', templateId);
    const snap = await getDoc(templateRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
