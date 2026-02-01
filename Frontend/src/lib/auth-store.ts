import { create } from 'zustand';

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
  users: User[];
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

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  users: initialUsers,
  
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
        const response = await fetch('http://localhost:5000/api/teachers/checkout', {
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
        const response = await fetch('http://localhost:5000/api/students/checkout', {
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
    
    set({ currentUser: null, isAuthenticated: false });
  },
  
  updateUser: (id, data) => {
    set(state => ({
      users: state.users.map(u => u.id === id ? { ...u, ...data } : u),
      currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...data } : state.currentUser,
    }));
  },

  loginWithBackend: async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('ℹ️ Note: 404 errors during login are expected - the system tries student → teacher → team member login in sequence');
      
      // Silent fetch wrapper to suppress console errors for expected 404s
      const silentFetch = async (url: string, options: RequestInit) => {
        try {
          return await fetch(url, options);
        } catch (error) {
          // Suppress fetch errors - they'll be handled by response status
          return null;
        }
      };
      
      // Check if it's the admin user (special case)
      if (email.toLowerCase() === 'hashaamamz1@gmail.com' && password === 'hashaam@123') {
        const adminUser = {
          id: '1',
          name: 'Admin',
          email: 'hashaamamz1@gmail.com',
          phone: '+92300111222',
          role: 'admin' as const,
          createdAt: '2023-01-01',
        };
        set({ currentUser: adminUser, isAuthenticated: true });
        return { success: true, user: adminUser };
      }

      // Try student login (404 is expected if not a student)
      try {
        const studentResponse = await silentFetch(`http://localhost:5000/api/students/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (!studentResponse) {
          // Fetch failed, continue to next login type
          throw new Error('Student login failed');
        }
        
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          const user = {
            id: studentData._id,
            name: studentData.name,
            email: studentData.email,
            phone: studentData.phone || '',
            role: 'student' as const,
            createdAt: studentData.createdAt,
            studentId: studentData._id,
          };
          set({ currentUser: user, isAuthenticated: true });
          console.log('Student login successful:', user);
          
          // Auto check-in student on login
          try {
            await fetch('http://localhost:5000/api/attendance/mark', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                studentId: studentData._id,
                status: 'present'
              }),
            });
            console.log('Student auto check-in successful');
          } catch (error) {
            console.error('Error auto checking in student:', error);
          }
          
          return { success: true, user };
        } else if (studentResponse.status !== 404) {
          // If it's not a 404, it's a real error (invalid credentials, etc.)
          const errorData = await studentResponse.json().catch(() => ({}));
          return { success: false, error: errorData.message || 'Student login failed' };
        }
        // 404 is expected - user is not a student, continue to next login type
      } catch (studentError) {
        // Suppress error logging for expected 404s
        if (studentError && (studentError as any).status !== 404) {
          console.log('Student login failed, trying teacher...');
        }
      }

      // Try teacher login (404 is expected if not a teacher)
      try {
        const teacherResponse = await silentFetch(`http://localhost:5000/api/teachers/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (!teacherResponse) {
          // Fetch failed, continue to next login type
          throw new Error('Teacher login failed');
        }
        
        if (teacherResponse.ok) {
          const teacherData = await teacherResponse.json();
          const user = {
            id: teacherData._id,
            name: teacherData.name,
            email: teacherData.email,
            phone: teacherData.phone || '',
            role: 'teacher' as const,
            createdAt: teacherData.createdAt,
            teacherId: teacherData._id,
          };
          set({ currentUser: user, isAuthenticated: true });
          console.log('Teacher login successful:', user);
          
          // Auto check-in teacher on login
          try {
            await fetch('http://localhost:5000/api/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userType: 'teacher',
                teacherId: teacherData._id,
                teacherName: teacherData.name,
                status: 'present'
              }),
            });
            console.log('Teacher auto check-in successful');
          } catch (error) {
            console.error('Error auto checking in teacher:', error);
          }
          
          return { success: true, user };
        } else if (teacherResponse.status !== 404) {
          // If it's not a 404, it's a real error (invalid credentials, etc.)
          const errorData = await teacherResponse.json().catch(() => ({}));
          return { success: false, error: errorData.message || 'Teacher login failed' };
        }
        // 404 is expected - user is not a teacher, continue to next login type
      } catch (teacherError) {
        // Suppress error logging for expected 404s
        if (teacherError && (teacherError as any).status !== 404) {
          console.log('Teacher login failed, trying team member...');
        }
      }

      // Try team member login (sales_team, team_leader)
      try {
        const teamResponse = await fetch(`http://localhost:5000/api/team/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          const user = {
            id: teamData._id,
            name: teamData.name,
            email: teamData.email,
            phone: teamData.phone || '',
            role: teamData.role as UserRole,
            createdAt: teamData.createdAt,
          };
          set({ currentUser: user, isAuthenticated: true });
          console.log('Team member login successful:', user);
          return { success: true, user };
        }
      } catch (teamError) {
        console.log('Team member login failed');
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Backend login error:', error);
      return { success: false, error: 'Login failed' };
    }
  },
}));
