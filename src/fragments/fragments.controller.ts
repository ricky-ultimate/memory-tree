import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FragmentsService } from './fragments.service';
import { FragmentType } from 'generated/prisma';

@Controller('fragments')
export class FragmentsController {
  constructor(private readonly fragmentsService: FragmentsService) {}

  @Post()
  create(
    @Body()
    createFragmentDto: {
      content: string;
      type?: FragmentType;
      userId: string;
      metadata?: any;
    },
  ) {
    return this.fragmentsService.create(createFragmentDto);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.fragmentsService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('userId') userId: string) {
    return this.fragmentsService.findOne(id, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    return this.fragmentsService.remove(id, userId);
  }
}
