import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // 🔥 Get token from localStorage (your key)
  const token = localStorage.getItem('qma_jwt');

  // If token exists, attach it
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(clonedReq);
  }

  // If no token, send request as it is
  return next(req);
};
