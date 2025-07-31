import { PartialType } from '@nestjs/swagger';
import { CreateFragmentDto } from './create-fragment.dto';

export class UpdateFragmentDto extends PartialType(CreateFragmentDto) {}
