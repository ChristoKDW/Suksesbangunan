import { Global, Module } from '@nestjs/common';
import { FaceRecognitionService } from './face-recognition.service.js';

@Global()
@Module({
  providers: [FaceRecognitionService],
  exports: [FaceRecognitionService],
})
export class FaceModule {}
