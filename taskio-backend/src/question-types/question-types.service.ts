import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionType } from './entities/question-type.entity';
import { CreateQuestionTypeDto } from './dto/create-question-type.dto';

@Injectable()
export class QuestionTypesService {
  constructor(
    @InjectRepository(QuestionType)
    private readonly questionTypeRepository: Repository<QuestionType>,
  ) {}

  async findAll(): Promise<QuestionType[]> {
    // Return all question types ordered by their creation date
    return this.questionTypeRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async create(
    createQuestionTypeDto: CreateQuestionTypeDto,
  ): Promise<QuestionType> {
    const existing = await this.questionTypeRepository.findOne({
      where: { type: createQuestionTypeDto.type },
    });

    if (existing) {
      throw new ConflictException(
        `Question type '${createQuestionTypeDto.type}' already exists`,
      );
    }

    const questionType = this.questionTypeRepository.create(
      createQuestionTypeDto,
    );
    return this.questionTypeRepository.save(questionType);
  }
}
