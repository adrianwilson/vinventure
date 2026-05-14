import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import express from 'express';
import serverlessExpress from '@codegenie/serverless-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

let cachedServer: express.Express | null = null;

async function bootstrap(): Promise<express.Express> {
  if (!cachedServer) {
    const expressApp = express();
    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    nestApp.enableCors();
    nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await nestApp.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

type ServerlessHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
let serverlessExpressInstance: ServerlessHandler | null = null;

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (!serverlessExpressInstance) {
    const app = await bootstrap();
    serverlessExpressInstance = serverlessExpress({ app }) as unknown as ServerlessHandler;
  }
  return serverlessExpressInstance(event, context);
}
