import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        'mongodb+srv://cunghianp_db_user:30082002siAA@timkeo.3wgz2jr.mongodb.net/?appName=timkeo',
    ),
  ],
})
export class DatabaseModule {}
