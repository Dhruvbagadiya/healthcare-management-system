'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { UserRoleEnum } from '@/types/index';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    role: UserRoleEnum.PATIENT,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/register', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        role: formData.role,
      });

      toast.success('Registration successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="card w-full max-w-md">
        <div className="mb-4 flex items-center justify-center">
          <img src="/logo.svg" alt="ShrutiCare logo" className="h-12 w-12" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-primary-600">Join Us</h1>
        <p className="mb-6 text-slate-600">Create your ShrutiCare account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="mb-2 block font-medium">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-2 block font-medium">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-2 block font-medium">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="input w-full"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="input w-full"
              minLength={8}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="input w-full"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-2 text-lg"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 border-t border-slate-200 pt-4 text-center">
          <p className="text-slate-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
