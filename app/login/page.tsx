"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isClientMode, setIsClientMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('mode') === 'client') {
      setIsClientMode(true);
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { error: signUpErr, data } = await supabase.auth.signUp({
          email, password,
          options: {
            data: {
              full_name: fullName,
              role: isClientMode ? 'client' : 'member'
            }
          }
        });
        if (signUpErr) throw signUpErr;

        // Create/update profile row
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: fullName || email,
            role: isClientMode ? 'client' : 'member',
            is_approved: isClientMode ? true : false // clients auto-approved, team needs chair approval
          });
        }

        alert(isClientMode
          ? "Client account created! You can now log in."
          : "Account created! Await admin approval before accessing the team portal."
        );
        setIsSignUp(false);
      } else {
        const { error: signInErr, data } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;

        // Route based on role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'client') {
          router.push("/client");
        } else {
          router.push("/team");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Link href="/" className="logo" style={{ display: 'block', marginBottom: '24px', justifyContent: 'center' }}>
          <span className="logo-mark">CO</span>COGAs
        </Link>
        <h2>{isSignUp ? (isClientMode ? "Client Registration" : "Create an Account") : "Welcome Back"}</h2>
        <p>{isSignUp ? (isClientMode ? "Access your project portal" : "Join the COGAs Team Portal") : "Sign in to access your dashboard"}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-lime" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <button className="auth-toggle" onClick={() => { setIsSignUp(!isSignUp); setIsClientMode(false); }}>
          {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
        </button>
        <button className="auth-toggle" onClick={() => { setIsClientMode(!isClientMode); setIsSignUp(true); }} style={{marginTop:'8px'}}>
          {isClientMode ? "← Back to team signup" : "Are you a client? Sign up here →"}
        </button>
      </div>
    </div>
  );
}