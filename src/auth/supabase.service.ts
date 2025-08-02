import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export interface SupabaseUserPayload {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  createdAt: Date;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private adminSupabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please check your environment variables.');
    }

    // Client for user operations
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Admin client for server-side operations
    this.adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    this.logger.log('Supabase service initialized');
  }

  /**
   * Verify JWT token and get user information
   */
  async verifyToken(token: string): Promise<SupabaseUserPayload> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        this.logger.warn(`Token verification failed: ${error?.message}`);
        throw new UnauthorizedException('Invalid or expired token');
      }

      return this.mapUserToPayload(user);
    } catch (error) {
      this.logger.error('Failed to verify token', error);
      throw new UnauthorizedException('Token verification failed');
    }
  }

  /**
   * Get user by ID (admin operation)
   */
  async getUserById(userId: string): Promise<SupabaseUserPayload | null> {
    try {
      const { data: { user }, error } = await this.adminSupabase.auth.admin.getUserById(userId);

      if (error || !user) {
        this.logger.warn(`User not found: ${userId}`);
        return null;
      }

      return this.mapUserToPayload(user);
    } catch (error) {
      this.logger.error(`Failed to get user ${userId}`, error);
      return null;
    }
  }

  /**
   * Create a new user (admin operation)
   */
  async createUser(email: string, password: string, metadata?: Record<string, any>): Promise<SupabaseUserPayload> {
    try {
      const { data, error } = await this.adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata || {}
      });

      if (error || !data.user) {
        this.logger.error(`Failed to create user: ${error?.message}`);
        throw new Error(`Failed to create user: ${error?.message}`);
      }

      this.logger.log(`User created successfully: ${data.user.id}`);
      return this.mapUserToPayload(data.user);
    } catch (error) {
      this.logger.error('Failed to create user', error);
      throw error;
    }
  }

  /**
   * Delete user (admin operation)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await this.adminSupabase.auth.admin.deleteUser(userId);

      if (error) {
        this.logger.error(`Failed to delete user ${userId}: ${error.message}`);
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      this.logger.log(`User deleted successfully: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Update user metadata (admin operation)
   */
  async updateUserMetadata(userId: string, metadata: Record<string, any>): Promise<SupabaseUserPayload> {
    try {
      const { data, error } = await this.adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: metadata
      });

      if (error || !data.user) {
        this.logger.error(`Failed to update user metadata: ${error?.message}`);
        throw new Error(`Failed to update user: ${error?.message}`);
      }

      this.logger.log(`User metadata updated: ${userId}`);
      return this.mapUserToPayload(data.user);
    } catch (error) {
      this.logger.error(`Failed to update user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get Supabase client for direct operations
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get admin Supabase client for admin operations
   */
  getAdminClient(): SupabaseClient {
    return this.adminSupabase;
  }

  /**
   * Map Supabase User to our UserPayload interface
   */
  private mapUserToPayload(user: User): SupabaseUserPayload {
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.user_metadata?.full_name || null,
      emailVerified: user.email_confirmed_at !== null,
      createdAt: new Date(user.created_at),
    };
  }
}
