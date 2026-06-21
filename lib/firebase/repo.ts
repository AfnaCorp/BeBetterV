import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type FirestoreError,
  type QueryConstraint,
  type Unsubscribe
} from "firebase/firestore";
import { firestore } from "./client";

type WithId<T> = T & { id: string };

function userCol(uid: string, name: string) {
  return collection(firestore, "users", uid, name);
}

function userDoc(uid: string, name: string, id: string) {
  return doc(firestore, "users", uid, name, id);
}

export function profileRef(uid: string) {
  return doc(firestore, "users", uid);
}

/** Souscription live au document profil (`users/{uid}`). */
export function subscribeProfile<T extends DocumentData>(
  uid: string,
  onData: (item: WithId<T> | null) => void,
  onError?: (err: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    profileRef(uid),
    (snap) => onData(snap.exists() ? { id: snap.id, ...(snap.data() as T) } : null),
    onError
  );
}

export async function writeProfile(uid: string, data: DocumentData) {
  await setDoc(profileRef(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribe<T extends DocumentData>(
  uid: string,
  name: string,
  onData: (items: WithId<T>[]) => void,
  onError?: (err: FirestoreError) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const q = query(userCol(uid, name), ...constraints);
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }))),
    onError
  );
}

export function subscribeDoc<T extends DocumentData>(
  uid: string,
  name: string,
  id: string,
  onData: (item: WithId<T> | null) => void,
  onError?: (err: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    userDoc(uid, name, id),
    (snap) => onData(snap.exists() ? { id: snap.id, ...(snap.data() as T) } : null),
    onError
  );
}

export async function createEntry<T extends DocumentData>(
  uid: string,
  name: string,
  data: T
): Promise<string> {
  const ref = await addDoc(userCol(uid, name), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function setEntry<T extends DocumentData>(
  uid: string,
  name: string,
  id: string,
  data: T
): Promise<void> {
  await setDoc(userDoc(uid, name, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function updateEntry(
  uid: string,
  name: string,
  id: string,
  data: DocumentData
): Promise<void> {
  await updateDoc(userDoc(uid, name, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteEntry(uid: string, name: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, name, id));
}

/** Supprime un champ précis d'un document (sentinel Firestore `deleteField`). */
export async function clearField(
  uid: string,
  name: string,
  id: string,
  field: string
): Promise<void> {
  await updateDoc(userDoc(uid, name, id), { [field]: deleteField(), updatedAt: serverTimestamp() });
}
