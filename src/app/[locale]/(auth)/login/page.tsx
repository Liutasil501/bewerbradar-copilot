import { Suspense } from 'react';
import { LoginButton } from '@/components/auth/login-button';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center w-full">
      <Suspense fallback={null}>
        <LoginButton />
      </Suspense>
    </div>
  );
}
