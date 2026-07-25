const DB_NAME = "spriteforge-assets";
const DB_VERSION = 1;
const STORE_NAME = "assets";

export type AssetKind = "image" | "video-frame";

export interface StoredAsset {
  id: string;
  blob: Blob;
  kind: AssetKind;
  fileName: string;
  mimeType: string;
  createdAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error("无法打开素材数据库"));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveAsset(asset: StoredAsset): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("素材保存失败"));
    transaction.objectStore(STORE_NAME).put(asset);
  });
  db.close();
}

export async function saveAssets(assets: StoredAsset[]): Promise<void> {
  if (assets.length === 0) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("批量素材保存失败"));

    const store = transaction.objectStore(STORE_NAME);
    assets.forEach((asset) => store.put(asset));
  });
  db.close();
}

export async function getAsset(id: string): Promise<StoredAsset | null> {
  const db = await openDatabase();
  const result = await new Promise<StoredAsset | null>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onerror = () =>
      reject(request.error ?? new Error("素材读取失败"));
    request.onsuccess = () => resolve((request.result as StoredAsset | undefined) ?? null);
  });
  db.close();
  return result;
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("素材删除失败"));
    transaction.objectStore(STORE_NAME).delete(id);
  });
  db.close();
}

export async function deleteAssets(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("批量素材删除失败"));

    const store = transaction.objectStore(STORE_NAME);
    ids.forEach((id) => store.delete(id));
  });
  db.close();
}

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  ratio: number;
}> {
  if (!navigator.storage?.estimate) {
    return { usage: 0, quota: 0, ratio: 0 };
  }

  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage ?? 0;
  const quota = estimate.quota ?? 0;

  return {
    usage,
    quota,
    ratio: quota > 0 ? usage / quota : 0
  };
}
