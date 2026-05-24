import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { axiosWrapper } from '../https/axiosWrapper';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. No token provided.');
            return;
        }

        verifyEmail(token);
    }, [searchParams]);

    const verifyEmail = async (token) => {
        try {
            console.log('Verifying email with token:', token);
            console.log('API URL:', `${import.meta.env.VITE_BACKEND_URL}/api/user/verify-email?token=${token}`);

            const response = await axiosWrapper.get(
                `/api/user/verify-email?token=${token}`
            );

            console.log('Verification response:', response.data);

            if (response.data.success) {
                setStatus('success');
                setMessage(response.data.message);
                setUserData(response.data.data);

                // Redirect to login after 5 seconds
                setTimeout(() => {
                    navigate('/auth');
                }, 5000);
            } else {
                setStatus('error');
                setMessage(response.data.message || 'Verification failed');
            }
        } catch (error) {
            console.error('Verification error:', error);
            console.error('Error response:', error.response);

            setStatus('error');
            setMessage(
                error.response?.data?.message ||
                error.message ||
                'Email verification failed. Please try again or contact support.'
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#2a2a2a] rounded-lg shadow-xl p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    {status === 'verifying' && (
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400"></div>
                    )}
                    {status === 'success' && (
                        <div className="bg-green-500 rounded-full p-4">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="bg-red-500 rounded-full p-4">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-4 text-white">
                    {status === 'verifying' && 'Verifying Your Email...'}
                    {status === 'success' && 'Email Verified!'}
                    {status === 'error' && 'Verification Failed'}
                </h2>

                {/* Message */}
                <p className="text-center text-gray-300 mb-6">
                    {status === 'verifying' && 'Please wait while we verify your email address...'}
                    {status === 'success' && message}
                    {status === 'error' && message}
                </p>

                {/* User Info (Success) */}
                {status === 'success' && userData && (
                    <div className="bg-[#1f1f1f] rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-400 mb-2">Account Details:</p>
                        <p className="text-white"><strong>Name:</strong> {userData.name}</p>
                        <p className="text-white"><strong>Email:</strong> {userData.email}</p>
                        <p className="text-white"><strong>Role:</strong> {userData.role}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    {status === 'success' && (
                        <button
                            onClick={() => navigate('/auth')}
                            className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-500 transition"
                        >
                            Go to Login
                        </button>
                    )}
                    {status === 'error' && (
                        <>
                            <button
                                onClick={() => navigate('/auth')}
                                className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-500 transition"
                            >
                                Back to Login
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition"
                            >
                                Try Again
                            </button>
                        </>
                    )}
                </div>

                {/* Auto-redirect message */}
                {status === 'success' && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Redirecting to login in 5 seconds...
                    </p>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
