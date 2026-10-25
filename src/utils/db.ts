import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { ColumnMetadata, WorkspaceConfig } from '../types';

export interface StoredDataset {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  rowCount: number;
  columnCount: number;
  rawCsv: string;
  columns: ColumnMetadata[];
  isBuiltin: boolean;
}

export interface StoredAnalysis {
  id: string;
  datasetId: string;
  name: string;
  description?: string;
  createdAt: number;
  config: WorkspaceConfig;
}

interface CorrelationAtlasDB extends DBSchema {
  datasets: {
    key: string;
    value: StoredDataset;
    indexes: { 'by-date': number };
  };
  workspace_state: {
    key: string;
    value: {
      id: string;
      activeDatasetId: string;
      config: WorkspaceConfig;
      updatedAt: number;
    };
  };
  saved_analyses: {
    key: string;
    value: StoredAnalysis;
    indexes: { 'by-dataset': string; 'by-date': number };
  };
}

const DB_NAME = 'correlation_atlas_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CorrelationAtlasDB>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<CorrelationAtlasDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CorrelationAtlasDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('datasets')) {
          const dsStore = db.createObjectStore('datasets', { keyPath: 'id' });
          dsStore.createIndex('by-date', 'createdAt');
        }

        if (!db.objectStoreNames.contains('workspace_state')) {
          db.createObjectStore('workspace_state', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('saved_analyses')) {
          const analysisStore = db.createObjectStore('saved_analyses', { keyPath: 'id' });
          analysisStore.createIndex('by-dataset', 'datasetId');
          analysisStore.createIndex('by-date', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

// Dataset Operations
export async function saveDataset(dataset: StoredDataset): Promise<void> {
  const db = await getDatabase();
  await db.put('datasets', dataset);
}

export async function getDataset(id: string): Promise<StoredDataset | undefined> {
  const db = await getDatabase();
  return db.get('datasets', id);
}

export async function getAllDatasets(): Promise<StoredDataset[]> {
  const db = await getDatabase();
  return db.getAllFromIndex('datasets', 'by-date');
}

export async function deleteDataset(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete('datasets', id);
}

// Workspace State Persistence
export async function saveWorkspaceState(
  activeDatasetId: string,
  config: WorkspaceConfig
): Promise<void> {
  const db = await getDatabase();
  await db.put('workspace_state', {
    id: 'current_session',
    activeDatasetId,
    config,
    updatedAt: Date.now(),
  });
}

export async function getWorkspaceState(): Promise<
  { id: string; activeDatasetId: string; config: WorkspaceConfig; updatedAt: number } | undefined
> {
  const db = await getDatabase();
  return db.get('workspace_state', 'current_session');
}

// Saved Analyses Snapshots
export async function saveAnalysisSnapshot(
  datasetId: string,
  name: string,
  config: WorkspaceConfig,
  description?: string
): Promise<StoredAnalysis> {
  const db = await getDatabase();
  const analysis: StoredAnalysis = {
    id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    datasetId,
    name,
    description,
    createdAt: Date.now(),
    config,
  };
  await db.put('saved_analyses', analysis);
  return analysis;
}

export async function getAnalysesByDataset(datasetId: string): Promise<StoredAnalysis[]> {
  const db = await getDatabase();
  return db.getAllFromIndex('saved_analyses', 'by-dataset', datasetId);
}

export async function deleteAnalysis(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete('saved_analyses', id);
}
