import { Global, Module } from '@nestjs/common';
import { LocationHelper } from './helpers/location.helper.js';

@Global()
@Module({
  providers: [LocationHelper],
  exports: [LocationHelper],
})
export class CommonModule {}