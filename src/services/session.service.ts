interface ActiveSession {
  userId: number;
  token: string;
  loginTime: Date;
  lastActivity: Date;
}

class SessionService {
  private activeSessions: Map<number, ActiveSession> = new Map();

  // Add or update active session for a user
  public setActiveSession(userId: number, token: string): void {
    const previousSession = this.activeSessions.get(userId);
    
    const session: ActiveSession = {
      userId,
      token,
      loginTime: new Date(),
      lastActivity: new Date()
    };
    
    this.activeSessions.set(userId, session);
    
  }

  // Get active session for a user
  public getActiveSession(userId: number): ActiveSession | undefined {
    return this.activeSessions.get(userId);
  }

  // Check if a token is valid for a user (matches their active session)
  public isTokenValid(userId: number, token: string): boolean {
    const activeSession = this.activeSessions.get(userId);
    
    
    if (!activeSession) {
      return false; // No active session
    }

    // Check if the token matches the active session
    if (activeSession.token !== token) {
      return false; // Token doesn't match active session
    }

    // Update last activity
    activeSession.lastActivity = new Date();
    
    return true;
  }

  // Remove active session (logout)
  public removeActiveSession(userId: number): void {
    this.activeSessions.delete(userId);
  }

  // Get all active sessions (for admin purposes)
  public getAllActiveSessions(): Map<number, ActiveSession> {
    return new Map(this.activeSessions);
  }

  // Clean up expired sessions (optional - for maintenance)
  public cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredUsers: number[] = [];

    for (const [userId, session] of this.activeSessions.entries()) {
      // Consider session expired after 24 hours of inactivity
      const hoursSinceActivity = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceActivity > 24) {
        expiredUsers.push(userId);
      }
    }

    expiredUsers.forEach(userId => {
      this.activeSessions.delete(userId);
    });
  }

  // Get session count (for statistics)
  public getActiveSessionCount(): number {
    return this.activeSessions.size;
  }
}

// Export singleton instance
export const sessionService = new SessionService();
