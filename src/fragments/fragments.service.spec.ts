import { Test, TestingModule } from '@nestjs/testing';
import { FragmentsService } from './fragments.service';

describe('FragmentsService', () => {
  let service: FragmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FragmentsService],
    }).compile();

    service = module.get<FragmentsService>(FragmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
