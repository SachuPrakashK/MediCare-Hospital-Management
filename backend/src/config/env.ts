import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    ACCESS_TOKEN_SECRET: z.string().min(32),
    REFRESH_TOKEN_SECRET: z.string().min(32),
    ACCESS_TOKEN_EXPIRATION: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRATION_DAYS: z.coerce.number().int().positive().default(7),
    FRONTEND_URL: z.string().url().default('http://localhost:4200'),
    FILE_UPLOAD_PATH: z.string().default('./uploads'),
    FILE_STORAGE_DRIVER: z.enum(['local', 'vercel-blob']).default('local'),
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    BLOB_STORE_ID: z.string().min(1).optional(),
    VERCEL_OIDC_TOKEN: z.string().min(1).optional(),
    FRONTEND_RESET_URL: z.string().url().default('http://localhost:4200/auth/reset-password'),
    NOTIFICATION_WEBHOOK_URL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().url().optional(),
    ),
    SMTP_HOST: z.string().trim().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),
    AI_PROVIDER: z.enum(['openai', 'ollama', 'disabled']).default('disabled'),
    OPENAI_API_KEY: z.string().min(1).optional(),
    AI_MODEL: z.string().trim().min(1).default('gpt-5-mini'),
    OLLAMA_BASE_URL: z.url().default('http://127.0.0.1:11434'),
    OLLAMA_MODEL: z.string().trim().min(1).default('qwen3:1.7b'),
    AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(5_000).max(120_000).default(45_000),
    AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(100).max(4_000).default(1_000),
    AI_CONVERSATION_RETENTION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === 'production' && value.FILE_STORAGE_DRIVER !== 'vercel-blob') {
      context.addIssue({
        code: 'custom',
        path: ['FILE_STORAGE_DRIVER'],
        message: 'Production requires durable private object storage.',
      });
    }
    if (
      value.FILE_STORAGE_DRIVER === 'vercel-blob' &&
      !value.BLOB_READ_WRITE_TOKEN &&
      !(value.BLOB_STORE_ID && value.VERCEL_OIDC_TOKEN)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['BLOB_READ_WRITE_TOKEN'],
        message: 'Vercel Blob requires a read-write token or an OIDC token with a store ID.',
      });
    }
    if (value.AI_PROVIDER === 'openai' && !value.OPENAI_API_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY is required when AI_PROVIDER is openai.',
      });
    }
    if (
      value.NODE_ENV === 'production' &&
      value.AI_PROVIDER === 'ollama' &&
      ['localhost', '127.0.0.1', '::1'].includes(new URL(value.OLLAMA_BASE_URL).hostname)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['OLLAMA_BASE_URL'],
        message: 'Production Ollama requires a private, remotely reachable server URL.',
      });
    }
  });

export const env = schema.parse(process.env);
