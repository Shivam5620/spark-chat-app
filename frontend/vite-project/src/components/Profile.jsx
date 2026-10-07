import { useState } from "react";
import { toast } from "react-hot-toast";
import { api, errorText } from "../api";
export default function Profile({ user, onSave }) {
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target));
    form.interests = form.interests
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    setBusy(true);
    try {
      const { data } = await api.patch("/users/me", form);
      onSave(data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="profile-form panel" onSubmit={submit}>
      <h2>A little about you</h2>
      <p>Give someone a reason to say hello.</p>
      <label>
        Profile photo URL
        <input
          name="profilePic"
          type="url"
          placeholder="https://…"
          defaultValue={user.profilePic}
        />
      </label>
      <div className="form-row">
        <label>
          Age
          <input
            name="age"
            type="number"
            min="18"
            max="100"
            required
            defaultValue={user.age}
          />
        </label>
        <label>
          City
          <input
            name="city"
            maxLength={80}
            defaultValue={user.city}
            placeholder="Indore"
          />
        </label>
      </div>
      <label>
        About me
        <textarea
          name="bio"
          maxLength={300}
          defaultValue={user.bio}
          placeholder="My ideal Sunday involves…"
        />
      </label>
      <label>
        Interests
        <input
          name="interests"
          defaultValue={user.interests?.join(", ")}
          placeholder="Coffee, Travel, Music"
        />
        <small>Separate with commas. Up to 8 interests.</small>
      </label>
      <button className="primary" disabled={busy}>
        {busy ? "Saving…" : "Save my profile"}
      </button>
    </form>
  );
}
