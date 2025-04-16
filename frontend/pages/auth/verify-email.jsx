import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      router.push('/auth/login');
    }
  }, [status, countdown]);

  const verifyEmail = async (token) => {
    try {
      await api.auth.verifyEmail(token);
      setStatus('success');
      setMessage('Your email has been successfully verified!');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to verify email');
    }
  };

  const resendVerification = async () => {
    try {
      await api.auth.resendVerification();
      setMessage('Verification email has been resent. Please check your inbox.');
    } catch (err) {
      setMessage('Failed to resend verification email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/">
          <span className="flex justify-center text-3xl font-bold text-green-600">
            SportsVest
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <div className="flex justify-center">
                <RefreshCw className="h-12 w-12 text-green-500 animate-spin" />
              </div>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {message}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Redirecting to login in {countdown} seconds...
                </p>
                <div className="mt-4">
                  <Link
                    href="/auth/login"
                    className="text-green-600 hover:text-green-500 font-medium"
                  >
                    Click here to login now
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Verification Failed
                </h3>
                <p className="mt-2 text-sm text-gray-500">{message}</p>
                <div className="mt-4 space-y-4">
                  <button
                    onClick={resendVerification}
                    className="text-green-600 hover:text-green-500 font-medium"
                  >
                    Resend verification email
                  </button>
                  <div>
                    <Link
                      href="/auth/login"
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Return to login
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
