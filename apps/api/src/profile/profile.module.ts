import { Body, Controller, Delete, Get, HttpCode, Module, Post, Req } from '@nestjs/common';
import { z } from 'zod';
import { AvatarCompleteSchema, AvatarUploadRequestSchema } from '@tour/shared';
import { ZodPipe, AppRequest } from '../common/http';
import { ProfileService } from './profile.service';
import { AvatarStorageService } from './avatar-storage.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('me')
  me(@Req() req: AppRequest) {
    return this.profile.me(req.user!.id);
  }

  @Post('avatar/upload-url')
  @HttpCode(200)
  uploadUrl(
    @Body(new ZodPipe(AvatarUploadRequestSchema))
    body: z.infer<typeof AvatarUploadRequestSchema>,
    @Req() req: AppRequest,
  ) {
    return this.profile.createAvatarUpload(req.user!.id, body);
  }

  @Post('avatar/complete')
  @HttpCode(200)
  complete(
    @Body(new ZodPipe(AvatarCompleteSchema))
    body: z.infer<typeof AvatarCompleteSchema>,
    @Req() req: AppRequest,
  ) {
    return this.profile.completeAvatar(req.user!.id, body.uploadId);
  }

  @Delete('avatar')
  @HttpCode(200)
  remove(@Req() req: AppRequest) {
    return this.profile.deleteAvatar(req.user!.id);
  }
}

@Module({
  providers: [ProfileService, AvatarStorageService],
  controllers: [ProfileController],
})
export class ProfileModule {}
