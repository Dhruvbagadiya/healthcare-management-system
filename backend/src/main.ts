import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

const sanitize = (val: any): any => {
  if (typeof val !== 'string') return val;
  return val.replace(/^["']|["']$/g, '').trim();
};

async function bootstrap() {
  console.log('🚀 Starting Aarogentix API - Version: 1.0.5 (Explicit Host Binding & Health Check)');
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Mandatory Request Logger
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`📥 [${req.method}] ${req.url} | Origin: ${req.headers.origin || 'unset'} | UA: ${req.headers['user-agent']?.substring(0, 50)}...`);
    next();
  });

  // Explicit CORS handling
  app.enableCors({
    origin: (origin, callback) => {
      // Allow any origin, but mirror it to support credentials
      callback(null, true);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With,Origin,x-tenant-id,x-organization-id',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Security Middleware (Configured for Cross-Origin JSON API)
  // Disable HTML-specific headers that cause mobile browsers to block cross-origin XHR
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,       // CSP is for HTML pages, not JSON APIs
      crossOriginOpenerPolicy: false,     // COOP blocks cross-origin requests on mobile browsers
      referrerPolicy: false,              // Not needed for API responses
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  // Global pipes and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Set API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Aarogentix API')
    .setDescription('Production-ready Aarogentix Hospital Management System API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Users')
    .addTag('Patients')
    .addTag('Doctors')
    .addTag('Appointments')
    .addTag('Prescriptions')
    .addTag('Billing')
    .addTag('Laboratory')
    .addTag('Pharmacy')
    .addTag('Dashboard')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`✅ Aarogentix API running on http://0.0.0.0:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
