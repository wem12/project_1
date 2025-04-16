import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, Trophy, ChartLine, Shield, Users } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user]);

  const features = [
    {
      icon: Trophy,
      title: 'Invest in Teams',
      description: 'Buy shares in your favorite sports teams and participate in their success.'
    },
    {
      icon: ChartLine,
      title: 'Track Performance',
      description: 'Monitor team performance and share value in real-time.'
    },
    {
      icon: Shield,
      title: 'Secure Trading',
      description: 'Trade with confidence using our secure and regulated platform.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Join a community of passionate sports investors and fans.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center border-b border-gray-200 py-6">
            <div className="flex justify-start">
              <Link href="/">
                <span className="text-2xl font-bold text-green-600">SportsVest</span>
              </Link>
            </div>
            <nav className="flex space-x-8">
              <Link href="/auth/login" className="text-base font-medium text-gray-500 hover:text-gray-900">
                Log in
              </Link>
              <Link href="/auth/register" className="text-base font-medium text-green-600 hover:text-green-500">
                Sign up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative">
        <main className="lg:relative">
          <div className="mx-auto max-w-7xl w-full pt-16 pb-20 text-center lg:py-48 lg:text-left">
            <div className="px-4 lg:w-1/2 sm:px-8">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                <span className="block">Invest in the teams</span>
                <span className="block text-green-600">you believe in</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-lg text-gray-500 sm:text-xl md:mt-5 md:max-w-3xl">
                Join the future of sports investment. Buy shares in your favorite teams,
                earn rewards, and become part of their success story.
              </p>
              <div className="mt-10 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link href="/auth/register" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10">
                    Get started
                    <ArrowRight className="ml-2" size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="relative w-full h-64 sm:h-72 md:h-96 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 lg:h-full">
            <img
              className="absolute inset-0 w-full h-full object-cover"
              src="/images/hero-image.jpg"
              alt="Sports stadium"
            />
          </div>
        </main>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose SportsVest?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              The innovative platform that connects fans with their favorite teams through investment.
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="pt-6">
                    <div className="flow-root bg-white rounded-lg px-6 pb-8">
                      <div className="-mt-6">
                        <div>
                          <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                          </span>
                        </div>
                        <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                          {feature.title}
                        </h3>
                        <p className="mt-5 text-base text-gray-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
