import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const bootstrap = async () => {
  const logger = new Logger();
  const port = process.env.PORT as string;
  const app = await NestFactory.create(AppModule);
  await app.listen(port);
  logger.log(`Server is running on port ${port}`);
};
void bootstrap();
