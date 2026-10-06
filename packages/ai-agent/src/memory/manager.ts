import type { MemoryEntry } from '@mlhkinfotech/types';

export class MemoryManager {
  private memoryMap: Map<string, MemoryEntry[]> = new Map();
  private maxEntries: number;

  constructor(maxEntries = 20) {
    this.maxEntries = maxEntries;
  }

  public getHistory(contactId: string): MemoryEntry[] {
    return this.memoryMap.get(contactId) || [];
  }

  public addEntry(contactId: string, role: MemoryEntry['role'], content: string, toolName?: string): void {
    const history = this.getHistory(contactId);
    history.push({
      role,
      content,
      toolName,
      timestamp: new Date()
    });

    // Auto-trim to last maxEntries
    if (history.length > this.maxEntries) {
      this.memoryMap.set(contactId, history.slice(-this.maxEntries));
    } else {
      this.memoryMap.set(contactId, history);
    }
  }

  public clear(contactId: string): void {
    this.memoryMap.delete(contactId);
  }

  public clearAll(): void {
    this.memoryMap.clear();
  }
}
