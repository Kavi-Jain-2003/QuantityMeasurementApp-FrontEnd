import { ApplicationConfig } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

// 🔥 ADD THESE IMPORTS
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn } from '@angular/common/http';

// 🔥 YOUR INTERCEPTOR
const jwtInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const token = localStorage.getItem('qma_jwt');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    provideAnimations(),

    // 🔥 THIS IS THE MISSING LINE
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    )
  ]
};
