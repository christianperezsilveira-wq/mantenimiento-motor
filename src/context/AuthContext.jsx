import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const AuthContext = createContext();

export const ADMIN_EMAILS = [
  'christianperezsilveira@gmail.com',
  'admin@mantenimientomotores.com',
  'chris@mantenimientomotores.com',
  'admin@gmail.com'
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('mantenimiento_guest_mode') === 'true';
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Cargar sesión inicial de Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Modo demostración / LocalStorage sin Supabase configurado todavía
      const savedUser = localStorage.getItem('mantenimiento_mock_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        setProfile({
          id: u.id,
          email: u.email,
          nombre: u.user_metadata?.nombre || u.email.split('@')[0],
          role: ADMIN_EMAILS.includes(u.email) ? 'admin' : 'user',
          has_completed_onboarding: localStorage.getItem(`onboarding_completed_${u.id}`) === 'true'
        });
        if (localStorage.getItem(`onboarding_completed_${u.id}`) !== 'true') {
          setShowOnboarding(true);
        }
      }
      setLoading(false);
      return;
    }

    // Inicializar listener de Supabase Auth
    const getInitialSession = async () => {
      try {
        const { data: { session: initSession } } = await supabase.auth.getSession();
        if (initSession) {
          setSession(initSession);
          setUser(initSession.user);
          await fetchProfile(initSession.user);
        }
      } catch (err) {
        console.error('Error fetching Supabase session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      const currentUser = currentSession?.user || null;
      setUser(currentUser);

      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('mantenimiento_guest_mode');
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Rastrear presencia en tiempo real de cualquier usuario logueado en la plataforma
  useEffect(() => {
    if (!isSupabaseConfigured() || !user) return;

    const channel = supabase.channel('online-users-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          email: user.email,
          nombre: profile?.nombre || user.email.split('@')[0],
          online_at: new Date().toISOString()
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  const fetchProfile = async (currentUser) => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      // Actualizar último inicio de sesión (last_login_at)
      const nowIso = new Date().toISOString();
      try {
        await supabase.from('profiles').update({ last_login_at: nowIso }).eq('id', currentUser.id);
      } catch (updErr) {
        // Ignorar si la columna se crea dinámicamente
      }

      const tourSeenLocally = localStorage.getItem('mantenimiento_tour_seen') === 'true' || 
                             localStorage.getItem(`onboarding_completed_${currentUser.id}`) === 'true';

      if (data) {
        setProfile({ ...data, last_login_at: nowIso });
        if (!data.has_completed_onboarding && !tourSeenLocally) {
          setShowOnboarding(true);
        }
      } else {
        // Crear perfil inicial si no existe
        const isUserAdmin = ADMIN_EMAILS.includes(currentUser.email);
        const newProfile = {
          id: currentUser.id,
          email: currentUser.email,
          nombre: currentUser.user_metadata?.full_name || currentUser.user_metadata?.nombre || currentUser.email.split('@')[0],
          role: isUserAdmin ? 'admin' : 'user',
          has_completed_onboarding: false,
          created_at: nowIso,
          last_login_at: nowIso
        };

        const { error: insertErr } = await supabase.from('profiles').insert([newProfile]);
        if (!insertErr) {
          setProfile(newProfile);
          if (!tourSeenLocally) {
            setShowOnboarding(true);
          }
        } else {
          // Fallback en memoria
          setProfile(newProfile);
          if (!tourSeenLocally) {
            setShowOnboarding(true);
          }
        }
      }
    } catch (e) {
      console.error('Error handling profile:', e);
      // Perfil fallback
      const isUserAdmin = ADMIN_EMAILS.includes(currentUser.email);
      const tourSeenLocally = localStorage.getItem('mantenimiento_tour_seen') === 'true' || 
                             localStorage.getItem(`onboarding_completed_${currentUser.id}`) === 'true';
      setProfile({
        id: currentUser.id,
        email: currentUser.email,
        nombre: currentUser.email.split('@')[0],
        role: isUserAdmin ? 'admin' : 'user',
        has_completed_onboarding: false
      });
      if (!tourSeenLocally) {
        setShowOnboarding(true);
      }
    }
  };

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      // Mock login Google para pruebas locales
      const mockGoogleUser = {
        id: 'user_google_' + Date.now(),
        email: 'usuario.google@ejemplo.com',
        user_metadata: { nombre: 'Usuario Google' }
      };
      localStorage.setItem('mantenimiento_mock_user', JSON.stringify(mockGoogleUser));
      setUser(mockGoogleUser);
      setProfile({
        id: mockGoogleUser.id,
        email: mockGoogleUser.email,
        nombre: 'Usuario Google',
        role: 'user',
        has_completed_onboarding: false
      });
      setIsGuest(false);
      localStorage.removeItem('mantenimiento_guest_mode');
      setShowOnboarding(true);
      return { user: mockGoogleUser };
    }

    const redirectTo = window.location.origin;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    });

    if (error) throw error;
    return data;
  };

  const loginWithEmail = async (email, password) => {
    if (!isSupabaseConfigured()) {
      // Mock login email
      const isUserAdmin = ADMIN_EMAILS.includes(email);
      const mockEmailUser = {
        id: 'user_email_' + String(email).replace(/[^a-z0-9]/gi, '_'),
        email: email,
        user_metadata: { nombre: email.split('@')[0] }
      };
      localStorage.setItem('mantenimiento_mock_user', JSON.stringify(mockEmailUser));
      setUser(mockEmailUser);
      const onboardingDone = localStorage.getItem(`onboarding_completed_${mockEmailUser.id}`) === 'true';
      setProfile({
        id: mockEmailUser.id,
        email: email,
        nombre: email.split('@')[0],
        role: isUserAdmin ? 'admin' : 'user',
        has_completed_onboarding: onboardingDone
      });
      setIsGuest(false);
      localStorage.removeItem('mantenimiento_guest_mode');
      if (!onboardingDone) {
        setShowOnboarding(true);
      }
      return { user: mockEmailUser };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password, nombre) => {
    if (!isSupabaseConfigured()) {
      // Mock signup email
      const isUserAdmin = ADMIN_EMAILS.includes(email);
      const mockNewUser = {
        id: 'user_' + Date.now(),
        email: email,
        user_metadata: { nombre: nombre || email.split('@')[0] }
      };
      localStorage.setItem('mantenimiento_mock_user', JSON.stringify(mockNewUser));
      setUser(mockNewUser);
      setProfile({
        id: mockNewUser.id,
        email: email,
        nombre: nombre || email.split('@')[0],
        role: isUserAdmin ? 'admin' : 'user',
        has_completed_onboarding: false
      });
      setIsGuest(false);
      localStorage.removeItem('mantenimiento_guest_mode');
      setShowOnboarding(true);
      return { user: mockNewUser };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre: nombre || email.split('@')[0] }
      }
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('mantenimiento_mock_user');
    localStorage.removeItem('mantenimiento_guest_mode');
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsGuest(false);
    setShowOnboarding(false);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('mantenimiento_guest_mode', 'true');
  };

  const completeOnboarding = async () => {
    setShowOnboarding(false);
    localStorage.setItem('mantenimiento_tour_seen', 'true');
    if (profile?.id) {
      setProfile(prev => prev ? { ...prev, has_completed_onboarding: true } : null);
      localStorage.setItem(`onboarding_completed_${profile.id}`, 'true');

      if (isSupabaseConfigured() && user) {
        try {
          await supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', user.id);
        } catch (err) {
          console.error('Error updating onboarding status in Supabase:', err);
        }
      }
    }
  };

  const isAdmin = profile?.role === 'admin' || (user?.email && ADMIN_EMAILS.includes(user.email));

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      isAdmin,
      isGuest,
      showOnboarding,
      setShowOnboarding,
      completeOnboarding,
      loginWithGoogle,
      loginWithEmail,
      signUpWithEmail,
      logout,
      continueAsGuest
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
