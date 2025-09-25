import useSWR, { mutate } from 'swr';
import axiosServices from 'utils/axios';

// utils
import { fetcher } from 'utils/axios';

export const endpoints = {
    key: 'profile',
    profile: '/users/profile',
    updateProfile: '/users/me',
    changePassword: '/users/change-password'
};

// ==============================|| PROFILE API ||============================== //

/**
 * Get current user profile
 */
export function useGetProfile() {
    const { data, isLoading, error, isValidating } = useSWR(endpoints.profile, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: true
    });

    return {
        profile: data?.data || null,
        isLoading,
        error,
        isValidating
    };
}

/**
 * Update user profile
 */
export async function updateProfile(profileData) {
    try {
        const response = await axiosServices.put(endpoints.updateProfile, profileData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
}

/**
 * Change user password
 */
export async function changePassword(passwordData) {
    try {
        const response = await axiosServices.put(endpoints.changePassword, passwordData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
}

/**
 * Refresh profile data
 */
export function refreshProfile() {
    mutate(endpoints.profile);
}
