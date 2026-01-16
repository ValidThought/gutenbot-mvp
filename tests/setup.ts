import { indexedDB, IDBRequest } from 'fake-indexeddb';

globalThis.indexedDB = indexedDB;
globalThis.IDBRequest = IDBRequest;
