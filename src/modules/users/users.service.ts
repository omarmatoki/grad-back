import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const userData: any = { ...createUserDto };

    if (createUserDto.password) {
      userData.password = await bcrypt.hash(createUserDto.password, 10);
    } else {
      userData.password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    }

    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async findAll(filters?: any): Promise<User[]> {
    return this.userModel
      .find(filters || {})
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('+password').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userModel
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      })
      .select('+resetPasswordToken +resetPasswordExpires +password')
      .exec();
  }

  async saveResetToken(id: string, token: string, expires: Date): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }

  async clearResetToken(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
    });
  }

  async findByInvitationToken(token: string): Promise<User | null> {
    return this.userModel
      .findOne({
        invitationToken: token,
        invitationExpires: { $gt: new Date() },
      })
      .select('+invitationToken +invitationExpires')
      .exec();
  }

  async saveInvitationToken(id: string, token: string, expires: Date): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      invitationToken: token,
      invitationExpires: expires,
    });
  }

  async clearInvitationToken(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      $unset: { invitationToken: 1, invitationExpires: 1 },
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
