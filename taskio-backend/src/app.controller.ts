import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ✨ ضف المسار ده هنا للتجربة
  @Get('tasks')
  getTasks() {
    return [
      { id: 1, title: 'تجهيز واجهة المستخدم للوحة التحكم' },
      { id: 2, title: 'ربط الـ Axios Interceptors بالباكيند' },
      { id: 3, title: 'تأمين المسارات بناءً على الـ Roles' },
    ];
  }
}
