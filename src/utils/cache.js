import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export class FileCache {
  constructor (options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
    this.maxEntries = options.maxEntries || 100;
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
  }

  // Generate cache key from file path and options
  _generateKey (filePath, options = {}) {
    const keyData = {
      path: path.resolve(filePath),
      options: JSON.stringify(options),
    };
    return crypto
      .createHash("md5")
      .update(JSON.stringify(keyData))
      .digest("hex");
  }

  // Check if cache entry is valid (not expired)
  _isValid (entry) {
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._remove(entry.key);
      return false;
    }
    return true;
  }

  // Remove entry from cache
  _remove (key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
    }
  }

  // Clean expired entries
  _cleanup () {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this._remove(key);
      }
    }
  }

  // Ensure cache doesn't exceed limits
  _enforceLimits () {
    // Remove expired entries first
    this._cleanup();

    // Remove oldest entries if we have too many
    if (this.cache.size > this.maxEntries) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, entries.length - this.maxEntries);
      toRemove.forEach(([key]) => this._remove(key));
    }

    // Remove entries if cache size is too large
    if (this.currentSize > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      let removedSize = 0;
      const targetSize = this.maxSize * 0.7; // Reduce to 70% of max

      for (const [key, entry] of entries) {
        if (this.currentSize - removedSize <= targetSize) break;
        this._remove(key);
        removedSize += entry.size;
      }
    }
  }

  // Get file from cache
  get (filePath, options = {}) {
    const key = this._generateKey(filePath, options);
    const entry = this.cache.get(key);

    if (this._isValid(entry)) {
      this.hits++;

      // Update timestamp for LRU
      entry.timestamp = Date.now();
      if (entry.expiresAt) {
        entry.expiresAt = Date.now() + this.ttl;
      }

      return entry.data;
    }

    this.misses++;
    return null;
  }

  // Set file in cache
  set (filePath, data, options = {}) {
    const key = this._generateKey(filePath, options);
    const size = Buffer.byteLength(JSON.stringify(data));

    // Don't cache if too large
    if (size > this.maxSize * 0.1) {
      // Don't cache files > 10% of max size
      return false;
    }

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this._remove(key);
    }

    const entry = {
      key,
      data,
      size,
      timestamp: Date.now(),
      expiresAt: options.ttl ? Date.now() + options.ttl : Date.now() + this.ttl,
    };

    this.cache.set(key, entry);
    this.currentSize += size;

    // Enforce limits after adding
    this._enforceLimits();

    return true;
  }

  // Invalidate cache for a file
  invalidate (filePath, options = {}) {
    const key = this._generateKey(filePath, options);
    this._remove(key);
  }

  // Invalidate all cache entries for a directory
  invalidateDirectory (dirPath) {
    const resolvedDir = path.resolve(dirPath);

    for (const [key, entry] of this.cache.entries()) {
      try {
        const cachedPath = JSON.parse(
          entry.data.metadata?.originalKey || "{}",
        ).path;
        if (cachedPath && cachedPath.startsWith(resolvedDir)) {
          this._remove(key);
        }
      } catch (error) {
        // If we can't parse, remove the entry
        this._remove(key);
      }
    }
  }

  // Clear entire cache
  clear () {
    this.cache.clear();
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
  }

  // Get cache statistics
  getStats () {
    return {
      size: this.currentSize,
      entries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate:
        this.hits + this.misses > 0
          ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + "%"
          : "0%",
      maxSize: this.maxSize,
      maxEntries: this.maxEntries,
    };
  }
}

// File system specific cache with intelligent invalidation
export class FileSystemCache extends FileCache {
  constructor (options = {}) {
    super({
      maxSize: options.maxSize || 50 * 1024 * 1024, // 50MB for file system
      maxEntries: options.maxEntries || 50,
      ttl: options.ttl || 2 * 60 * 1000, // 2 minutes for file system
      ...options,
    });

    this.fileStats = new Map();
  }

  // Enhanced cache key with file stats
  async _generateEnhancedKey (filePath, options = {}) {
    try {
      const stats = await fs.stat(filePath);
      const keyData = {
        path: path.resolve(filePath),
        mtime: stats.mtimeMs,
        size: stats.size,
        options: JSON.stringify(options),
      };
      return crypto
        .createHash("md5")
        .update(JSON.stringify(keyData))
        .digest("hex");
    } catch (error) {
      // If we can't get stats, use basic key
      return super._generateKey(filePath, options);
    }
  }

  // Get with file stat validation
  async get (filePath, options = {}) {
    try {
      const stats = await fs.stat(filePath);
      const key = await this._generateEnhancedKey(filePath, {
        ...options,
        mtime: stats.mtimeMs,
      });
      const entry = this.cache.get(key);

      if (this._isValid(entry)) {
        // Verify file hasn't changed
        if (entry.metadata && entry.metadata.mtime === stats.mtimeMs) {
          this.hits++;
          entry.timestamp = Date.now();
          if (entry.expiresAt) {
            entry.expiresAt = Date.now() + this.ttl;
          }
          return entry.data;
        } else {
          // File changed, invalidate cache
          this._remove(key);
        }
      }

      this.misses++;
      return null;
    } catch (error) {
      // File doesn't exist or can't be accessed
      return null;
    }
  }

  // Set with file metadata
  async set (filePath, data, options = {}) {
    try {
      const stats = await fs.stat(filePath);
      const key = await this._generateEnhancedKey(filePath, {
        ...options,
        mtime: stats.mtimeMs,
      });
      const size = Buffer.byteLength(JSON.stringify(data));

      if (size > this.maxSize * 0.1) {
        return false;
      }

      if (this.cache.has(key)) {
        this._remove(key);
      }

      const entry = {
        key,
        data,
        size,
        timestamp: Date.now(),
        expiresAt: options.ttl
          ? Date.now() + options.ttl
          : Date.now() + this.ttl,
        metadata: {
          mtime: stats.mtimeMs,
          size: stats.size,
          originalKey: JSON.stringify({ path: filePath, options }),
        },
      };

      this.cache.set(key, entry);
      this.currentSize += size;
      this._enforceLimits();

      return true;
    } catch (error) {
      // Can't get file stats, don't cache
      return false;
    }
  }
}

// Singleton instance for global file system cache
export const fileSystemCache = new FileSystemCache();

// Utility function for caching file reads
export async function cachedFileRead (
  filePath,
  encoding = "utf-8",
  forceRefresh = false,
) {
  if (forceRefresh) {
    fileSystemCache.invalidate(filePath);
  }

  const cached = await fileSystemCache.get(filePath, { encoding });
  if (cached) {
    return cached.content;
  }

  const content = await fs.readFile(filePath, encoding);
  await fileSystemCache.set(filePath, { content, encoding }, { encoding });

  return content;
}

// Utility function for caching directory listings
export async function cachedDirectoryList (dirPath, options = {}) {
  const cached = await fileSystemCache.get(dirPath, options);
  if (cached) {
    return cached.files;
  }

  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const files = items.map((item) => ({
    name: item.name,
    type: item.isDirectory() ? "directory" : "file",
    path: path.join(dirPath, item.name),
  }));

  await fileSystemCache.set(dirPath, { files, options }, options);

  return files;
}
