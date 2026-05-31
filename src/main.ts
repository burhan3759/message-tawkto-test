import 'reflect-metadata';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

@Controller()
class AppController {
  @Get()
  getHello(): string {
    return 'hello world';
  }
}

@Module({
  controllers: [AppController],
})
class AppModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('API running at http://localhost:3000');
}

void bootstrap();
