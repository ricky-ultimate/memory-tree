import { Injectable } from '@nestjs/common';
import { CreateFragmentDto } from './dto/create-fragment.dto';
import { UpdateFragmentDto } from './dto/update-fragment.dto';

@Injectable()
export class FragmentsService {
  create(createFragmentDto: CreateFragmentDto) {
    return 'This action adds a new fragment';
  }

  findAll() {
    return `This action returns all fragments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fragment`;
  }

  update(id: number, updateFragmentDto: UpdateFragmentDto) {
    return `This action updates a #${id} fragment`;
  }

  remove(id: number) {
    return `This action removes a #${id} fragment`;
  }
}
