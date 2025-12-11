export interface SignupData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface SigninData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
}

export interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  whatsappNumber?: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  whatsappNumber?: string;
}

export interface AddressFormData {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ExtendedFormData extends Omit<FormData, 'address'> {
  address: AddressFormData;
}
