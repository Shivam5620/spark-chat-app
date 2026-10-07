import { useState } from "react";
import { toast } from "react-hot-toast";
import { api, errorText } from "../api";
export default function Auth({ onLogin }) {
  const [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(
        `/auth/${signup ? "signup" : "login"}`,
        Object.fromEntries(new FormData(e.target)),
      );
      onLogin(data);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth">
      <section className="auth-story">
        <div className="brand">
          ♥ spark<span>MAKE A CONNECTION</span>
        </div>
        <div>
          <p className="eyebrow">LESS SCROLLING. MORE SPARKS.</p>
          <h1>
            A little hello.
            <br />A whole new
            <br />
            <em>possibility.</em>
          </h1>
          <p>
            Find your people. Make a connection.
            <br />
            Let the conversation take it from there.
          </p>
        </div>
        <small>Meaningful connections start here · 18+</small>
      </section>
      <section className="auth-panel">
        <form onSubmit={submit}>
          <div className="mini-heart">♥</div>
          <h2>{signup ? "Your next chapter starts here." : "Welcome back."}</h2>
          <p>
            {signup
              ? "Create your profile and see who sparks your interest."
              : "Good conversations are waiting for you."}
          </p>
          {signup && (
            <label>
              Your name
              <input
                name="fullName"
                required
                maxLength={80}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Username
            <input
              name="username"
              required
              pattern="[a-zA-Z0-9_]{3,30}"
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={signup ? 8 : 1}
              maxLength={72}
              autoComplete={signup ? "new-password" : "current-password"}
            />
          </label>
          {signup && (
            <div className="form-row">
              <label>
                Age
                <input name="age" type="number" min="18" max="100" required />
              </label>
              <label>
                Gender
                <select name="gender">
                  <option value="female">Woman</option>
                  <option value="male">Man</option>
                  <option value="other">Another identity</option>
                </select>
              </label>
            </div>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Please wait…" : signup ? "Create account" : "Sign in"} →
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => setSignup(!signup)}
          >
            {signup
              ? "Already a member? Sign in"
              : "New here? Create an account"}
          </button>
          <small>For adults 18 and over. Be kind. Be yourself.</small>
        </form>
      </section>
    </div>
  );
}
