import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { adapter } from '../../lib/adapter';

@Injectable()
export class DatabaseService extends PrismaClient {
  constructor() {
    super({ adapter });
  }
}
