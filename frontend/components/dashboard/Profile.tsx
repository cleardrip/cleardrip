import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Edit, User, Mail, Phone, MapPin, Eye, EyeOff } from 'lucide-react';
import { AuthService } from '@/lib/httpClient/userAuth';
import { useAuth } from '@/context/AuthContext';
import { AddressFormData, ExtendedFormData, FormData, FormErrors, SignupData } from '@/lib/types/auth/userAuth';
import { toast } from 'sonner';

const ProfileComponent: React.FC = () => {
  const { user, refetch } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState<ExtendedFormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || '',
    },
    password: '',
    whatsappNumber: user?.whatsappNumber || ''
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Helper function to format address for display
  const formatAddressForDisplay = (address: any): string => {
    if (!address) return '';

    const parts = [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  };

  const handleInputChange = (field: keyof ExtendedFormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddressChange = (field: keyof AddressFormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updateData: Partial<SignupData> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
      };

      // Handle address - only include if at least one field is filled
      const hasAddressData = Object.values(formData.address).some(value => value.trim());
      if (hasAddressData) {
        updateData.address = formData.address;
      }

      await AuthService.updateProfile(updateData);

      // Refresh auth context to get updated user data
      await refetch();
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: '' }));
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (): void => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      whatsappNumber: user?.whatsappNumber || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        postalCode: user?.address?.postalCode || '',
        country: user?.address?.country || '',
      },
      password: ''
    });
    setIsEditing(true);
    setFormErrors({});
  };

  const handleCancelEdit = (): void => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        postalCode: user?.address?.postalCode || '',
        country: user?.address?.country || '',
      },
      password: ''
    });
    setFormErrors({});
  };

  // Small helper to render initials when no profile image
  const renderInitials = (name?: string) => {
    if (!name) return null;
    const parts = name.trim().split(' ');
    const initials = ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase();
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-lg font-semibold">
        {initials}
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Edit Profile</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Update your personal details. Changes will be saved to your account.</p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="text-gray-600 hover:bg-gray-50 text-sm px-3 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={isLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 sm:px-4 rounded-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Save changes</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="md:col-span-1 flex flex-col items-center md:items-start">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-100 mb-3 flex items-center justify-center">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  renderInitials(user?.name) || <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 text-center md:text-left break-all">{user?.email}</p>
            </div>

            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="name" className="text-xs sm:text-sm font-medium text-gray-700">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`mt-1 w-full text-sm ${formErrors.name ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-indigo-200`}
                    placeholder="Enter your name"
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div title='Email cannot be changed'>
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled={true}
                    className={`mt-1 w-full text-sm ${formErrors.email ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-indigo-200`}
                    placeholder="you@example.com"
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs sm:text-sm font-medium text-gray-700">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`mt-1 w-full text-sm ${formErrors.phone ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-indigo-200`}
                    placeholder="+91 XXXXXXXXXX"
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                </div>

                {/* <div>
                  <Label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-700">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                    className={`mt-1 w-full ${formErrors.whatsappNumber ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-indigo-200`}
                    placeholder="+91 XXXXXXXXXX"
                  />
                  {formErrors.whatsappNumber && <p className="text-red-500 text-xs mt-1">{formErrors.whatsappNumber}</p>}
                </div> */}
              </div>

              <div className="mt-3 sm:mt-4">
                <Label className="text-xs sm:text-sm font-medium text-gray-700">Address</Label>
                <div className="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-2 sm:p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      placeholder="Street address"
                      className="border-gray-200 focus:ring-2 focus:ring-indigo-200 text-sm"
                    />
                    <Input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="City"
                      className="border-gray-200 focus:ring-2 focus:ring-indigo-200 text-sm"
                    />
                    <Input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      placeholder="State"
                      className="border-gray-200 focus:ring-2 focus:ring-indigo-200 text-sm"
                    />
                    <Input
                      type="text"
                      value={formData.address.postalCode}
                      onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                      placeholder="Postal Code"
                      className="border-gray-200 focus:ring-2 focus:ring-indigo-200 text-sm"
                    />
                    <Input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) => handleAddressChange('country', e.target.value)}
                      placeholder="Country"
                      className="sm:col-span-2 border-gray-200 focus:ring-2 focus:ring-indigo-200 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4 w-full md:w-1/3">
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              renderInitials(user?.name) || <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            )}
          </div>
          <div className="md:hidden flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{user?.name || 'User'}</h3>
            <p className="text-xs sm:text-sm text-gray-500 break-all">{user?.email}</p>
          </div>
          <div className="hidden md:block">
            <h3 className="text-lg font-semibold text-gray-800">{user?.name || 'User'}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="flex-1 w-full md:w-2/3">
          <div className="flex justify-between items-start mb-4 md:mb-0">
            <div className="md:hidden">
              {/* Mobile duplicate removed since shown above */}
            </div>
            <div className="ml-auto">
              <Button
                onClick={handleEditClick}
                size="sm"
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 px-3 sm:px-4 rounded-lg inline-flex items-center gap-2 text-sm"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Edit profile</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg flex items-start gap-2 sm:gap-3">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Email</p>
                <p className="text-sm sm:text-base text-gray-800 font-medium break-all">{user?.email}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg flex items-start gap-2 sm:gap-3">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Phone</p>
                  <p className="text-sm sm:text-base text-gray-800 font-medium break-words">{user.phone}</p>
                </div>
              </div>
            )}
            {user?.whatsappNumber && (
              <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg flex items-start gap-2 sm:gap-3">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">WhatsApp Number</p>
                  <p className="text-sm sm:text-base text-gray-800 font-medium break-words">{user.whatsappNumber}</p>
                </div>
              </div>
            )}

            {user?.address && (
              <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg flex items-start gap-2 sm:gap-3 sm:col-span-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Address</p>
                  <p className="text-sm sm:text-base text-gray-800 font-medium break-words">{formatAddressForDisplay(user.address)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileComponent;
