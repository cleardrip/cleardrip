"use client"

import { AuthState } from "@/lib/types/auth/auth"
import { APIURL } from "@/utils/env";
import { createContext, ReactNode, useContext, useEffect, useState } from "react"

const AuthContext = createContext<AuthState>({
    authenticated: false,
    role: null,
    adminRole: null,
    user: null,
    authLoading: true,
    refetch: () => { },
    isSuperAdmin: false,
    isAdmin: false,
    isUser: false,
    logout: async () => { }
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<Omit<AuthState, 'refetch' | 'isAdmin' | 'isUser' | 'logout'>>({
        authenticated: false,
        role: null,
        adminRole: null,
        user: null,
        authLoading: true,
        isSuperAdmin: false,
    });

    const fetchAuth = async () => {
        setState(prev => ({
            ...prev,
            authLoading: true
        }));

        try {
            const response = await fetch(`${APIURL}/auth/me`, {
                method: 'GET',
                credentials: 'include',
            });
            
            const data = await response.json();
            
            if(!response.ok){
                throw new Error(data?.error || "Not Authenticated");
            }

            const role = data.role;
            const adminRole = data.user?.adminRole ?? null;
                        
            setState({
                authenticated: true,
                role,
                adminRole,
                user: data.user,
                authLoading: false,
                // ✅ Fix: Check multiple possible super admin indicators
                isSuperAdmin: role === "SUPER_ADMIN" || data.user?.role === "SUPERADMIN" || adminRole === "SUPER_ADMIN",
            });
        }
        catch(error){ 
            console.error('Error Fetching the Authentication', error);
            setState({
                authenticated: false,
                role: null,
                adminRole: null,
                user: null,
                authLoading: false,
                isSuperAdmin: false
            });
        }
    };

    useEffect(() => {
        fetchAuth();
    }, []);

    const logout = async () => {
        try {
            let logoutUrl = '';

            switch (state.role) {
                case 'ADMIN':
                    logoutUrl = `${APIURL}/auth/admin/logout`;
                    break;
                case 'SUPER_ADMIN':
                    logoutUrl = `${APIURL}/auth/admin/logout`;
                    break;
                case 'USER':
                    logoutUrl = `${APIURL}/auth/signout`;
                    break;
                default: 
                    console.warn('No role found, skipping logout API Call');
                    break;
            }

            if(logoutUrl){
                await fetch(logoutUrl, {
                    method: 'POST',
                    credentials: 'include'
                });
            }
        }
        catch(error) {
            console.error('Logout Failed' + error);
        }
        finally {
            setState({
                authenticated: false,
                role: null,
                adminRole: null,
                user: null,
                authLoading: false,
                isSuperAdmin: false,
            });
        }
    };

    const value: AuthState = {
        ...state,
        refetch: fetchAuth,
        isUser: state.role === 'USER',
        // ✅ Fix: Check multiple admin role patterns
        isAdmin: state.role === 'ADMIN' || state.role === 'SUPER_ADMIN' || state.adminRole === 'ADMIN',
        // ✅ Fix: Check multiple super admin patterns
        isSuperAdmin: state.role === 'SUPER_ADMIN' || state.adminRole === 'SUPER_ADMIN',
        logout,
    };
    
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
