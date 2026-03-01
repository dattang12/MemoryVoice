'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-court-600 rounded-xl flex items-center justify-center shadow-md">
                <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
                  <circle cx="16" cy="22" r="6" fill="#a8845c" />
                  <path d="M16 4 L18 16 L16 18 L14 16 Z" fill="white" />
                  <path d="M10 8 L14 17 L16 18 L12 15 Z" fill="white" fillOpacity="0.9" />
                  <path d="M22 8 L18 17 L16 18 L20 15 Z" fill="white" fillOpacity="0.9" />
                  <path d="M7 12 L13 17 L16 18 L10 14 Z" fill="white" fillOpacity="0.8" />
                  <path d="M25 12 L19 17 L16 18 L22 14 Z" fill="white" fillOpacity="0.8" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-xl text-gray-900 block leading-tight">RallyCoach</span>
                <span className="text-xs text-gray-500 hidden sm:block">AI Badminton Coach</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('analytics-section')}
                className="text-gray-600 hover:text-primary-500 transition"
              >
                Analytics
              </button>
              <button
                onClick={() => scrollToSection('practice-section')}
                className="text-gray-600 hover:text-primary-500 transition"
              >
                Practice
              </button>
              <button
                onClick={() => scrollToSection('racket-section')}
                className="text-gray-600 hover:text-primary-500 transition"
              >
                Racket
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Court pattern background */}
        <div className="absolute inset-0 court-bg opacity-50" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Sport badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-court-50 border border-court-200 rounded-full mb-6">
            <span className="text-2xl">&#127992;</span>
            <span className="text-sm font-medium text-court-700">Powered by Google Gemini AI</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
            Your AI-Powered
            <br />
            <span className="gradient-text">Badminton Coach</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Analyze your technique, practice with real-time feedback, and get
            personalized equipment recommendations. All powered by advanced AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25 quick-action-btn"
            >
              Start Training Free
            </Link>
            <button
              onClick={() => scrollToSection('features-section')}
              className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Hero Image Placeholder */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-primary-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Video Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Upload your gameplay videos for detailed AI analysis
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-accent-green/20 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-accent-green"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Live Coaching</h3>
                <p className="text-gray-600 text-sm">
                  Real-time feedback as you practice your form
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-accent-yellow/20 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-accent-yellow"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Gear</h3>
                <p className="text-gray-600 text-sm">
                  Personalized racket recommendations for your style
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Improve
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Powered by Google Gemini AI for intelligent coaching insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Pose Analysis',
                description:
                  'MediaPipe-powered skeleton tracking analyzes your form in real-time',
              },
              {
                icon: '🤖',
                title: 'AI Coaching',
                description:
                  'Gemini AI provides instant feedback and long-term training plans',
              },
              {
                icon: '📊',
                title: 'Progress Tracking',
                description:
                  'Visualize your improvement over time with detailed analytics',
              },
              {
                icon: '🏸',
                title: 'Drill Library',
                description:
                  'Access targeted drills to address your specific weaknesses',
              },
              {
                icon: '🎾',
                title: 'Gear Matching',
                description:
                  'Find the perfect racket based on your playing style and level',
              },
              {
                icon: '📱',
                title: 'Works Anywhere',
                description:
                  'Practice at home with just your webcam - no special equipment needed',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics-section" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1 bg-primary-100 text-primary-600 rounded-full text-sm font-medium mb-4">
                Video Analytics
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Deep Dive Into Your Technique
              </h2>
              <p className="text-gray-600 mb-6">
                Upload your gameplay or practice videos and let our AI analyze every
                aspect of your form. Get detailed feedback on:
              </p>
              <ul className="space-y-3">
                {[
                  'Swing mechanics and racket path',
                  'Footwork and stance positioning',
                  'Body rotation and weight transfer',
                  'Shot timing and preparation',
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-accent-green"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={user ? '/analytics' : '/signup'}
                className="inline-block mt-8 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition"
              >
                Analyze Your Video
              </Link>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-gray-900">Analysis Results</span>
                  <span className="text-sm text-accent-green">Complete</span>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="font-medium text-red-800 text-sm">High Priority</p>
                    <p className="text-red-700 text-sm">Elbow drops too low during backhand</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <p className="font-medium text-yellow-800 text-sm">Medium Priority</p>
                    <p className="text-yellow-700 text-sm">Stance could be wider for stability</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="font-medium text-green-800 text-sm">Looking Good</p>
                    <p className="text-green-700 text-sm">Excellent body rotation on clears</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Section */}
      <section id="practice-section" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-gray-900 rounded-2xl p-4">
              <div className="aspect-video bg-gray-800 rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-400">Webcam Preview</p>
                  </div>
                </div>
                {/* Skeleton overlay preview */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-50"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="45"
                    y1="25"
                    x2="55"
                    y2="25"
                    stroke="#22c55e"
                    strokeWidth="0.5"
                  />
                  <line
                    x1="50"
                    y1="25"
                    x2="50"
                    y2="45"
                    stroke="#22c55e"
                    strokeWidth="0.5"
                  />
                  <line
                    x1="45"
                    y1="45"
                    x2="55"
                    y2="45"
                    stroke="#22c55e"
                    strokeWidth="0.5"
                  />
                  <line
                    x1="45"
                    y1="45"
                    x2="40"
                    y2="65"
                    stroke="#22c55e"
                    strokeWidth="0.5"
                  />
                  <line
                    x1="55"
                    y1="45"
                    x2="60"
                    y2="65"
                    stroke="#22c55e"
                    strokeWidth="0.5"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-accent-green rounded-full animate-pulse"></div>
                  <span className="text-gray-400 text-sm">Live</span>
                </div>
                <div className="text-right">
                  <p className="text-accent-green font-medium">Good Form!</p>
                  <p className="text-gray-500 text-sm">Keep your elbow steady</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-block px-4 py-1 bg-accent-green/20 text-accent-green rounded-full text-sm font-medium mb-4">
                Practice Mode
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Real-Time Form Coaching
              </h2>
              <p className="text-gray-600 mb-6">
                Practice your swings with instant visual feedback. Our pose detection
                tracks your body position and provides live coaching cues:
              </p>
              <ul className="space-y-3">
                {[
                  'Green skeleton overlay when form is correct',
                  'Red indicators highlight areas to improve',
                  'Voice-style text cues guide your movements',
                  'Track green/red ratio to see consistency',
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-accent-green"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={user ? '/practice' : '/signup'}
                className="inline-block mt-8 px-6 py-3 bg-accent-green text-white rounded-lg font-medium hover:bg-green-600 transition"
              >
                Start Practicing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Racket Section */}
      <section id="racket-section" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1 bg-accent-yellow/20 text-yellow-700 rounded-full text-sm font-medium mb-4">
                Racket Finder
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Find Your Perfect Racket
              </h2>
              <p className="text-gray-600 mb-6">
                Based on your skill level, playing style, and areas you want to
                improve, we recommend rackets that match your needs:
              </p>
              <ul className="space-y-3">
                {[
                  'Recommendations based on your weakness analysis',
                  'Compare weight, balance, and flexibility',
                  'Save favorites for later reference',
                  'Direct links to purchase options',
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-accent-yellow"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={user ? '/racket' : '/signup'}
                className="inline-block mt-8 px-6 py-3 bg-accent-yellow text-gray-900 rounded-lg font-medium hover:bg-yellow-400 transition"
              >
                Find Your Racket
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Astrox 88D', 'Nanoflare 800', 'Arcsaber 11', 'Thruster F'].map(
                (name, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <div className="bg-gray-200 rounded-lg h-32 mb-3 flex items-center justify-center">
                      <span className="text-4xl">🏸</span>
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{name}</p>
                    <p className="text-gray-500 text-xs">
                      {i % 2 === 0 ? 'Power' : 'Speed'} Style
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Court gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-court-600 via-court-700 to-court-800" />
        {/* Court lines pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(to right, #fff 2px, transparent 2px), linear-gradient(to bottom, #fff 2px, transparent 2px)',
            backgroundSize: '60px 60px'
          }} />
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30" />
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6">
            <span className="text-5xl">&#127992;</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Elevate Your Game?
          </h2>
          <p className="text-court-100 mb-8 text-lg">
            Join thousands of players improving their badminton skills with AI coaching
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-court-700 rounded-xl font-semibold hover:bg-court-50 transition shadow-lg quick-action-btn"
          >
            <span>Get Started Free</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 relative overflow-hidden">
        {/* Subtle court pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
                  <circle cx="16" cy="22" r="6" fill="#a8845c" />
                  <path d="M16 4 L18 16 L16 18 L14 16 Z" fill="white" />
                  <path d="M10 8 L14 17 L16 18 L12 15 Z" fill="white" fillOpacity="0.9" />
                  <path d="M22 8 L18 17 L16 18 L20 15 Z" fill="white" fillOpacity="0.9" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-xl text-white block">RallyCoach</span>
                <span className="text-xs text-gray-400">AI Badminton Coach</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span className="text-xl">&#127992;</span>
              <span>Powered by Google Gemini AI and MediaPipe</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">Train smarter. Play better. Rally to victory.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
