import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto';

// Omit sourceId and targetId from updates - connections shouldn't change
export class UpdateBranchDto extends PartialType(
  OmitType(CreateBranchDto, ['sourceId', 'targetId'] as const)
) {}
