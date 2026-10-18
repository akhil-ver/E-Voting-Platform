/**
 * Centralized Provider Factory
 * Reads environment configuration and instantiates concrete infrastructure adapters
 * UI and API boundaries never import concrete adapters directly
 */
import {
  IDatabaseService,
  IStorageService,
  IBlockchainService,
  IAIService,
  INotificationService,
  IAuditService,
  IAuthService,
  IEligibilityService,
  IElectionService,
  IVotingService,
  IFraudDetectionService,
  IVerificationService,
} from '../interfaces';

import { MockDatabaseService } from '../../adapters/database/mock';
import { SupabaseDatabaseService, SupabaseStorageService } from '../../adapters/database/supabase';
import { MongoDatabaseService } from '../../adapters/database/mongodb';
import { PostgresDatabaseService } from '../../adapters/database/postgres';
import { FirebaseFirestoreService, FirebaseStorageService } from '../../adapters/database/firebase';
import { LocalStorageService } from '../../adapters/storage/local';
import { CloudinaryStorageService } from '../../adapters/storage/cloudinary';
import { MockBlockchainService } from '../../adapters/blockchain/mock';
import { AlchemyBlockchainService } from '../../adapters/blockchain/alchemy';
import { MockAIService } from '../../adapters/ai/mock';
import { GeminiAIService } from '../../adapters/ai/gemini';
import { OpenAIService } from '../../adapters/ai/openai';
import { ConsoleNotificationService } from '../../adapters/notification/console';
import { ResendNotificationService } from '../../adapters/notification/resend';

import { AuditService } from '../../security/audit-service';
import { AuthService } from '../auth-service';
import { EligibilityService } from '../eligibility-service';
import { ElectionService } from '../election-service';
import { VotingService } from '../voting-service';
import { FraudDetectionService } from '../fraud-detection-service';
import { VerificationService } from '../verification-service';

export interface ServiceContainer {
  database: IDatabaseService;
  storage: IStorageService;
  blockchain: IBlockchainService;
  ai: IAIService;
  notification: INotificationService;
  audit: IAuditService;
  auth: IAuthService;
  eligibility: IEligibilityService;
  election: IElectionService;
  voting: IVotingService;
  fraud: IFraudDetectionService;
  verification: IVerificationService;
  providers: {
    database: string;
    storage: string;
    blockchain: string;
    ai: string;
    notification: string;
  };
}

let containerInstance: ServiceContainer | null = null;

export function initializeServices(): ServiceContainer {
  if (containerInstance) {
    return containerInstance;
  }

  const dbProvider = process.env.DATABASE_PROVIDER || 'mock';
  const storageProvider = process.env.STORAGE_PROVIDER || 'local';
  const blockchainProvider = process.env.BLOCKCHAIN_PROVIDER || 'mock';
  const aiProvider = process.env.AI_PROVIDER || 'mock';
  const notificationProvider = process.env.NOTIFICATION_PROVIDER || 'console';

  // 1. Database Adapter
  let database: IDatabaseService;
  if (dbProvider === 'mock' || dbProvider === 'memory') {
    database = new MockDatabaseService();
  } else if (dbProvider === 'firebase' || dbProvider === 'firestore') {
    database = new FirebaseFirestoreService();
  } else if (dbProvider === 'postgres' || dbProvider === 'neon') {
    database = new PostgresDatabaseService();
  } else if (dbProvider === 'mongodb') {
    database = new MongoDatabaseService();
  } else if (dbProvider === 'supabase') {
    database = new SupabaseDatabaseService();
  } else if (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL) {
    database = new PostgresDatabaseService();
  } else if (process.env.MONGODB_URI) {
    database = new MongoDatabaseService();
  } else if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
    database = new SupabaseDatabaseService();
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.ENABLE_FIREBASE_FIRESTORE === 'true') {
    database = new FirebaseFirestoreService();
  } else {
    database = new MockDatabaseService();
  }

  // 2. Storage Adapter
  let storage: IStorageService;
  if (storageProvider === 'local' || storageProvider === 'mock' || storageProvider === 'memory') {
    storage = new LocalStorageService();
  } else if (storageProvider === 'firebase') {
    storage = new FirebaseStorageService();
  } else if (storageProvider === 'cloudinary') {
    storage = new CloudinaryStorageService();
  } else if (storageProvider === 'supabase') {
    storage = new SupabaseStorageService();
  } else if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)) {
    storage = new CloudinaryStorageService();
  } else if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
    storage = new SupabaseStorageService();
  } else {
    storage = new LocalStorageService();
  }

  // 3. Blockchain Adapter
  let blockchain: IBlockchainService;
  if (blockchainProvider === 'alchemy' || blockchainProvider === 'ethereum' || process.env.ALCHEMY_RPC_URL || process.env.ETHEREUM_RPC_URL) {
    blockchain = new AlchemyBlockchainService();
  } else {
    blockchain = new MockBlockchainService();
  }

  // 4. AI Adapter
  let ai: IAIService;
  if (aiProvider === 'openai' && process.env.OPENAI_API_KEY) {
    ai = new OpenAIService();
  } else if (aiProvider === 'gemini' || process.env.GEMINI_API_KEY) {
    ai = new GeminiAIService();
  } else if (process.env.OPENAI_API_KEY) {
    ai = new OpenAIService();
  } else {
    ai = new MockAIService();
  }

  // 5. Notification Adapter
  let notification: INotificationService;
  if (notificationProvider === 'resend' || process.env.RESEND_API_KEY) {
    notification = new ResendNotificationService();
  } else {
    notification = new ConsoleNotificationService();
  }

  // 6. Security & Audit Service
  const audit: IAuditService = new AuditService(database);

  // 7. Domain Services
  const auth: IAuthService = new AuthService(database, audit);
  const eligibility: IEligibilityService = new EligibilityService(database, audit);
  const election: IElectionService = new ElectionService(database, audit);
  const voting: IVotingService = new VotingService(database, blockchain, audit);
  const fraud: IFraudDetectionService = new FraudDetectionService(database, audit);
  const verification: IVerificationService = new VerificationService(database, blockchain, audit);

  containerInstance = {
    database,
    storage,
    blockchain,
    ai,
    notification,
    audit,
    auth,
    eligibility,
    election,
    voting,
    fraud,
    verification,
    providers: {
      database: dbProvider,
      storage: storageProvider,
      blockchain: blockchainProvider,
      ai: aiProvider,
      notification: notificationProvider,
    },
  };

  return containerInstance;
}

export function getServices(): ServiceContainer {
  if (!containerInstance) {
    return initializeServices();
  }
  return containerInstance;
}
