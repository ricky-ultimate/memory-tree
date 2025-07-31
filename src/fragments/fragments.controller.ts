import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FragmentsService } from './fragments.service';
import { CreateFragmentDto } from './dto/create-fragment.dto';
import { UpdateFragmentDto } from './dto/update-fragment.dto';

@Controller('fragments')
export class FragmentsController {
  constructor(private readonly fragmentsService: FragmentsService) {}

  @Post()
  create(@Body() createFragmentDto: CreateFragmentDto) {
    return this.fragmentsService.create(createFragmentDto);
  }

  @Get()
  findAll() {
    return this.fragmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fragmentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFragmentDto: UpdateFragmentDto) {
    return this.fragmentsService.update(+id, updateFragmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fragmentsService.remove(+id);
  }
}
