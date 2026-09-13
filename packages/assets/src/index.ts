import { generateId } from '@nova/shared';
import type { ID } from '@nova/shared';

// ─── Asset Types ─────────────────────────────────────────────────────────────

export type AssetType = 'image' | 'svg' | 'font' | 'video' | 'audio';

export interface Asset {
  id: ID;
  name: string;
  type: AssetType;
  /** Relative path within the project's assets folder */
  relativePath: string;
  /** Absolute path on disk (set when project is open) */
  absolutePath?: string;
  /** Data URL for preview/thumbnail */
  thumbnailDataUrl?: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  createdAt: string;
}

// ─── Asset Manager ────────────────────────────────────────────────────────────

export class AssetManager {
  private _assets: Map<ID, Asset> = new Map();
  private _projectAssetsPath = '';

  setProjectPath(assetsPath: string): void {
    this._projectAssetsPath = assetsPath;
  }

  registerAsset(asset: Asset): void {
    this._assets.set(asset.id, asset);
  }

  getAsset(id: ID): Asset | undefined {
    return this._assets.get(id);
  }

  getAllAssets(): Asset[] {
    return Array.from(this._assets.values());
  }

  removeAsset(id: ID): void {
    this._assets.delete(id);
  }

  createAssetRecord(
    name: string,
    type: AssetType,
    relativePath: string,
    mimeType: string,
    sizeBytes: number,
    extra?: { width?: number; height?: number; thumbnailDataUrl?: string }
  ): Asset {
    const asset: Asset = {
      id: generateId('asset'),
      name,
      type,
      relativePath,
      mimeType,
      sizeBytes,
      createdAt: new Date().toISOString(),
      ...extra,
    };
    this._assets.set(asset.id, asset);
    return asset;
  }

  serialize(): Asset[] {
    return Array.from(this._assets.values());
  }

  deserialize(assets: Asset[], absoluteBasePath: string): void {
    this._assets.clear();
    for (const asset of assets) {
      asset.absolutePath = `${absoluteBasePath}/${asset.relativePath}`;
      this._assets.set(asset.id, asset);
    }
  }
}
