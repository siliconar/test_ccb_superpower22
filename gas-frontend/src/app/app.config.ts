// src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { PlumeService } from './core/services/plume.service';
import { MockPlumeService } from './core/services/mock-plume.service';
import { ApiPlumeService } from './core/services/api-plume.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: PlumeService,
      useClass: environment.useMock ? MockPlumeService : ApiPlumeService,
    },
  ],
};
