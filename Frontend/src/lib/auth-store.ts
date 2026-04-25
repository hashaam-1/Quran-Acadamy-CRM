import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export type UserRole = 'admin' | 'sales_team' | 'team_leader' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  // Role-specific fields
  assignedLeads?: string[]; // for sales_team
  assignedStudents?: string[]; // for teacher
  teacherId?: string; // for teacher role
  studentId?: string; // for student role
}

interface AuthStore {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  users: User[];
  token?: string; // 🔒 Store only token, not full user object
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (id: string, data: Partial<User>) => void;
  addUser: (user: User, password: string) => void;
  loginWithBackend: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: any }>;
}

const initialUsers: User[] = [
  { id: '1', name: 'Admin', email: 'hashaamamz1@gmail.com', phone: '+92300111222', role: 'admin', createdAt: '2023-01-01' },
];

// Simple password storage (in real app, this would be hashed and on backend)
const passwords: Record<string, string> = {
  'hashaamamz1@gmail.com': 'hashaam@123',
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,
      users: initialUsers,
      token: undefined,

      login: (email, password) => {
        // Debug logging
        console.log('Login attempt:', { email, password });
        console.log('Current users:', get().users);
        console.log('Current passwords:', passwords);
        
        // Find user with case-insensitive email matching
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          console.log('User not found for email:', email);
          return { success: false, error: 'User not found' };
        }
        
        // Check password using the same case-insensitive email key
        const storedPassword = passwords[user.email.toLowerCase()];
        console.log('Password check:', { storedPassword, provided: password, match: storedPassword === password });
        
        if (storedPassword !== password) {
          return { success: false, error: 'Invalid password' };
        }
        
        set({ currentUser: user, isAuthenticated: true });
        console.log('Login successful for:', user);
        return { success: true };
      },
      
      addUser: (user, password) => {
        console.log('Adding user:', { user, password });
        passwords[user.email.toLowerCase()] = password;
        set(state => ({
          users: [...state.users, user],
        }));
        console.log('User added. Total users:', get().users);
        console.log('Updated passwords:', passwords);
      },
      
      logout: async () => {
        const currentUser = get().currentUser;
        
        // Auto-checkout teacher on logout
        if (currentUser && currentUser.role === 'teacher') {
          try {
            const response = await fetch(`${API_BASE_URL}/teachers/checkout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ teacherId: currentUser.id }),
            });
            
            if (response.ok) {
              console.log('Teacher checked out successfully');
            }
          } catch (error) {
            console.error('Error checking out teacher:', error);
          }
        }
        
        // Auto-checkout student on logout
        if (currentUser && currentUser.role === 'student') {
          try {
            const response = await fetch(`${API_BASE_URL}/students/checkout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ studentId: currentUser.id }),
            });
            
            if (response.ok) {
              console.log('Student checked out successfully');
            }
          } catch (error) {
            console.error('Error checking out student:', error);
          }
        }
        
        set({ currentUser: null, isAuthenticated: false, token: undefined });
      },
      
      updateUser: (id, data) => {
        set(state => ({
          users: state.users.map(u => u.id === id ? { ...u, ...data } : u),
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...data } : state.currentUser,
        }));
      },

      loginWithBackend: async (email, password) => {
        try {
          // ✅ FIXED: Normalize email to lowercase and trim before sending
          const normalizedEmail = email.toLowerCase().trim();
          
          console.log('🔐 Attempting unified login for:', normalizedEmail);
          
          // ✅ FIXED: Clear any existing auth state to prevent role overwrite
          const { currentUser } = get();
          if (currentUser) {
            console.log('🔄 Clearing existing auth state to prevent role overwrite');
            set({ currentUser: null, isAuthenticated: false });
          }
          
          // ✅ FIXED: Single unified login endpoint with normalized email
          const response = await fetch(`${API_BASE_URL}/auth/unified-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, password })
          });

          if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.message || 'Login failed' };
          }

          const data = await response.json();
          
          if (!data.success) {
            return { success: false, error: data.message || 'Login failed' };
          }

          // ✅ FIXED: Store only the returned role explicitly
          const user = {
            id: data.user._id || data.user.id,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone || '',
            role: data.user.role, // ✅ Explicit role from backend
            createdAt: data.user.createdAt,
            ...(data.user.studentId && { studentId: data.user.studentId }),
            ...(data.user.teacherId && { teacherId: data.user.teacherId }),
          };

          set({ currentUser: user, isAuthenticated: true, token: data.token });
          console.log('✅ Unified login successful:', { role: user.role, email: user.email, token: data.token ? 'present' : 'missing' });
          
          // Role-specific auto check-in
          try {
            if (user.role === 'student') {
              await fetch(`${API_BASE_URL}/attendance/mark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  studentId: user.id,
                  status: 'present'
                }),
              });
              console.log('Student auto check-in successful');
            } else if (user.role === 'teacher') {
              await fetch(`${API_BASE_URL}/teachers/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId: user.id }),
              });
              console.log('Teacher auto check-in successful');
            }
          } catch (error) {
            console.error('Error auto checking in:', error);
          }
          
          return { success: true, user };
        } catch (error) {
          console.error('Unified login error:', error);
          return { success: false, error: 'Login failed' };
        }
      },
    }),
    {
      name: 'auth-token', // localStorage key - only store token
      version: 2, // Version for token-only storage
      storage: createJSONStorage(() => sessionStorage),
      // 🔒 CRITICAL: Store only token, not full user object
      partialize: (state) => ({ 
        token: state.token 
      }),
      onRehydrateStorage: () => async (state) => {
        console.log('🔄 Rehydrating auth...');

        try {
          if (state?.token) {
            // ✅ Add timeout protection
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`${API_BASE_URL}/auth/verify-token`, {
              headers: {
                Authorization: `Bearer ${state.token}`,
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) throw new Error("Invalid token");

            const data = await res.json();

            if (data.success && data.user) {
              const user = {
                id: data.user._id || data.user.id,
                name: data.user.name,
                email: data.user.email,
                phone: data.user.phone || '',
                role: data.user.role,
                createdAt: data.user.createdAt,
                ...(data.user.studentId && { studentId: data.user.studentId }),
                ...(data.user.teacherId && { teacherId: data.user.teacherId }),
              };

              // ✅ Return the state to be set - no circular reference
              return {
                currentUser: user,
                isAuthenticated: true,
                isLoading: false,
                token: state.token,
              };
            }
          }
        } catch (err) {
          console.log("❌ Token validation failed:", err.message);
        }

        // ✅ ALWAYS fallback - prevents infinite loading
        return {
          currentUser: null,
          isAuthenticated: false,
          isLoading: false,
          token: undefined,
        };
      },
    }
  )
);
