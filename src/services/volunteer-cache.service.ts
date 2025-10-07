import NodeCache from "node-cache";

class VolunteerCacheService {
    private cache: NodeCache;

    constructor() {
        this.cache = new NodeCache({
            stdTTL: 300, //5 minutos 
            checkperiod: 60, //1 minuto

        }); 
}

  
  getVolunteersKey(page: number, limit: number, status?: string, name?: string): string {
    return `volunteers:${page}:${limit}:${status || 'all'}:${name || 'all'}`;
  }

  getVolunteerKey(id: number): string {
    return `volunteer:${id}`;
  }

  getVolunteerOptionsKey(userId?: number): string {
    return userId ? `volunteer_options:user:${userId}` : 'volunteer_options:all';
  }

  // Get cached data
  get<T>(key: string): T | undefined {
    return this.cache.get(key);
  }

    // Set cached data
    set(key: string, value: any, ttl: number = 300): void {
        this.cache.set(key, value, ttl);
      }
    
      // Delete specific cache entries
      del(key: string): void {
        this.cache.del(key);
      }
    
      // Invalidate all volunteer-related cache
      invalidateVolunteers(): void {
        const keys = this.cache.keys();
        keys.forEach(key => {
          if (key.startsWith('volunteer')) {
            this.cache.del(key);
          }
        });
      }
    
      // Get cache stats
      getStats() {
        return this.cache.getStats();
      }
}


    export const volunteerCache = new VolunteerCacheService();

   

