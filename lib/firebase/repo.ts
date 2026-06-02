import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
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

export async function readProfile(uid: string) {
  const snap = await getDoc(profileRef(uid));
  return snap.exists() ? { id: snap.id, ...(snap.data() as DocumentData) } : null;
}

export async function writeProfile(uid: string, data: DocumentData) {
  await setDoc(profileRef(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function listAll<T extends DocumentData>(
  uid: string,
  name: string,
  ...constraints: QueryConstraint[]
): Promise<WithId<T>[]> {
  const q = query(userCol(uid, name), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
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

export const orderByDateDesc = orderBy("date", "desc");
export const orderByCreatedAsc = orderBy("createdAt", "asc");
