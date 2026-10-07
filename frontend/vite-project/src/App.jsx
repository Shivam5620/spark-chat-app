import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  FiHeart,
  FiX,
  FiMessageCircle,
  FiUser,
  FiLogOut,
  FiMapPin,
  FiSliders,
  FiCompass,
} from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { api, serverUrl, errorText } from "./api";
import Avatar from "./components/Avatar";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import Chat from "./components/Chat";
export default function App() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [view, setView] = useState("discover"),
    [people, setPeople] = useState([]),
    [matches, setMatches] = useState([]),
    [selected, setSelected] = useState(null),
    [socket, setSocket] = useState(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [failure, setFailure] = useState(""),
    [match, setMatch] = useState(null),
    [filters, setFilters] = useState(false),
    [gender, setGender] = useState("all"),
    [maxAge, setMaxAge] = useState(100);
  const startX = useRef(0);
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch((err) => {
        if (err.response?.status !== 401) toast.error(errorText(err));
      })
      .finally(() => setReady(true));
  }, []);
  async function refresh() {
    setLoading(true);
    setFailure("");
    try {
      const [a, b] = await Promise.all([
        api.get("/users"),
        api.get("/users/matches"),
      ]);
      setPeople(a.data);
      setMatches(b.data);
    } catch (err) {
      setFailure(errorText(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!user?._id) return;
    let active = true;
    Promise.all([api.get("/users"), api.get("/users/matches")])
      .then(([a, b]) => {
        if (active) {
          setPeople(a.data);
          setMatches(b.data);
        }
      })
      .catch((err) => {
        if (active) setFailure(errorText(err));
      });
    const connection = io(serverUrl || window.location.origin, {
      withCredentials: true,
    });
    connection.on("connect", () => setSocket(connection));
    connection.on("connect_error", () =>
      toast.error("Live chat disconnected. Check backend connection.", {
        id: "socket",
      }),
    );
    connection.on("match", ({ user: other }) => {
      setMatch(other);
      setMatches((old) =>
        old.some((x) => x._id === other._id) ? old : [...old, other],
      );
    });
    return () => {
      active = false;
      connection.disconnect();
    };
  }, [user?._id]);
  const person = people.find(
    (p) => (gender === "all" || p.gender === gender) && p.age <= maxAge,
  );
  async function swipe(action) {
    if (!person || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/users/${person._id}/swipe`, { action });
      setPeople((old) => old.filter((p) => p._id !== person._id));
      if (data.matched) {
        setMatch(person);
        setMatches((old) =>
          old.some((x) => x._id === person._id) ? old : [...old, person],
        );
      }
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      await api.post("/auth/logout");
      socket?.disconnect();
      setSocket(null);
      setUser(null);
      setPeople([]);
      setMatches([]);
      setSelected(null);
      setMatch(null);
      setView("discover");
    } catch (err) {
      toast.error(errorText(err));
    }
  }
  return (
    <>
      <Toaster position="top-center" />
      {!ready ? (
        <div className="splash">
          ♥ <p>Finding your spark…</p>
        </div>
      ) : !user ? (
        <Auth onLogin={setUser} />
      ) : (
        <div className="layout">
          <aside className="sidebar">
            <div className="brand">
              ♥ spark<span>A LITTLE MORE HUMAN.</span>
            </div>
            <button className="account" onClick={() => setView("profile")}>
              <Avatar person={user} />
              <div>
                <strong>{user.fullName}</strong>
                <small>Edit your profile ↗</small>
              </div>
            </button>
            <nav>
              {[
                ["discover", FiCompass, "Discover"],
                ["messages", FiMessageCircle, "Messages"],
                ["profile", FiUser, "My profile"],
              ].map(([id, Icon, label]) => (
                <button
                  key={id}
                  className={view === id ? "active" : ""}
                  onClick={() => setView(id)}
                >
                  <Icon />
                  {label}
                  {id === "messages" && <span>{matches.length}</span>}
                </button>
              ))}
            </nav>
            <div className="match-label">
              YOUR CONNECTIONS <span>{matches.length}</span>
            </div>
            <div className="match-list">
              {matches.length ? (
                matches.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => {
                      setSelected(p);
                      setView("messages");
                    }}
                  >
                    <Avatar person={p} />
                    <div>
                      <strong>{p.fullName}</strong>
                      <small>Start a conversation</small>
                    </div>
                    <FiMessageCircle />
                  </button>
                ))
              ) : (
                <p>
                  When the feeling is mutual,
                  <br />
                  you’ll find them here.
                </p>
              )}
            </div>
            <div className="sidebar-note">
              <FiHeart />
              <strong>Good things start with a hello.</strong>
              <p>Be curious, be kind, be you.</p>
            </div>
            <button className="logout" onClick={logout}>
              <FiLogOut /> Sign out
            </button>
          </aside>
          <main>
            <header className="topbar">
              <div>
                <p className="eyebrow">YOUR NEXT CHAPTER</p>
                <h1>
                  {view === "discover"
                    ? "Discover"
                    : view === "messages"
                      ? "Your conversations"
                      : "My profile"}
                  <span>.</span>
                </h1>
              </div>
              <span className="top-note">
                Made for real connections <FiHeart />
              </span>
            </header>
            {view === "profile" ? (
              <Profile user={user} onSave={setUser} />
            ) : view === "messages" ? (
              selected ? (
                <Chat
                  key={selected._id}
                  person={selected}
                  user={user}
                  socket={socket}
                />
              ) : (
                <section className="panel empty">
                  <FiMessageCircle />
                  <h2>A match. A hello. A possibility.</h2>
                  <p>Select a connection from the sidebar to start chatting.</p>
                  <button
                    className="primary"
                    onClick={() => setView("discover")}
                  >
                    Discover people
                  </button>
                </section>
              )
            ) : (
              <>
                <div className="discover-heading">
                  <div>
                    <h2>Someone worth saying hello to.</h2>
                    <p>Find a little common ground. See where it goes.</p>
                  </div>
                  <button
                    className="filter-button"
                    onClick={() => setFilters(!filters)}
                  >
                    <FiSliders /> Preferences
                  </button>
                </div>
                {filters && (
                  <div className="filters panel">
                    <label>
                      Show me
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="all">Everyone</option>
                        <option value="female">Women</option>
                        <option value="male">Men</option>
                        <option value="other">Other identities</option>
                      </select>
                    </label>
                    <label>
                      Maximum age: {maxAge}
                      <input
                        type="range"
                        min="18"
                        max="100"
                        value={maxAge}
                        onChange={(e) => setMaxAge(Number(e.target.value))}
                      />
                    </label>
                  </div>
                )}
                {!user.age && (
                  <p className="notice">
                    Complete your age in My profile to start connecting.
                  </p>
                )}
                {failure ? (
                  <div className="empty">
                    <p role="alert">{failure}</p>
                    <button onClick={refresh}>Try again</button>
                  </div>
                ) : loading ? (
                  <div className="empty">Finding people…</div>
                ) : person ? (
                  <div className="discovery">
                    <div className="card-stack">
                      <article
                        className="person-card"
                        onPointerDown={(e) => {
                          startX.current = e.clientX;
                        }}
                        onPointerUp={(e) => {
                          const diff = e.clientX - startX.current;
                          if (Math.abs(diff) > 90)
                            swipe(diff > 0 ? "like" : "pass");
                        }}
                      >
                        <Avatar key={person._id} person={person} large />
                        <div className="photo-shade" />
                        <div className="card-caption">
                          <span className="open-label">
                            OPEN TO A NEW CONNECTION
                          </span>
                          <h2>
                            {person.fullName}
                            <span>{person.age}</span>
                          </h2>
                          <p>
                            <FiMapPin /> {person.city || "Somewhere lovely"}
                          </p>
                          <p className="bio">
                            {person.bio ||
                              "There’s a story behind every hello. Ask me about mine."}
                          </p>
                          <div className="tags">
                            {person.interests?.map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </article>
                      <div className="actions">
                        <div>
                          <button
                            className="pass"
                            aria-label="Pass on profile"
                            disabled={busy}
                            onClick={() => swipe("pass")}
                          >
                            <FiX />
                          </button>
                          <small>PASS</small>
                        </div>
                        <div>
                          <button
                            className="like"
                            aria-label="Like profile"
                            disabled={busy || !user.age}
                            onClick={() => swipe("like")}
                          >
                            <FiHeart />
                          </button>
                          <small>LIKE</small>
                        </div>
                      </div>
                      <p className="swipe-hint">
                        Swipe a card or follow your heart.
                      </p>
                    </div>
                    <aside className="discovery-note">
                      <span className="note-icon">✳</span>
                      <p className="eyebrow">A FRESH PERSPECTIVE</p>
                      <h2>
                        Your kind of
                        <br />
                        person is out there.
                      </h2>
                      <p>
                        A shared playlist. A favourite coffee spot. Sometimes
                        the smallest things spark the best connections.
                      </p>
                      <div className="note-line" />
                      <small>
                        ♥ Like someone to let them know.
                        <br />
                        <br />☏ Match when you both feel it.
                        <br />
                        <br />✧ Make the first move. Say hello.
                      </small>
                    </aside>
                  </div>
                ) : (
                  <section className="panel empty">
                    <FiHeart />
                    <h2>You’re all caught up.</h2>
                    <p>
                      New profiles will appear here as people join. Try
                      adjusting your preferences.
                    </p>
                    <button className="primary" onClick={refresh}>
                      Check for new people
                    </button>
                  </section>
                )}
              </>
            )}
          </main>
          {match && (
            <div className="modal-backdrop">
              <section
                className="match-modal"
                role="dialog"
                aria-modal="true"
                aria-label="New match"
              >
                <div className="mini-heart">♥</div>
                <p className="eyebrow">THE FEELING IS MUTUAL</p>
                <h2>It’s a spark!</h2>
                <Avatar person={match} />
                <p>You and {match.fullName} liked each other.</p>
                <button
                  className="primary"
                  onClick={() => {
                    setSelected(match);
                    setView("messages");
                    setMatch(null);
                  }}
                >
                  Say hello <FiMessageCircle />
                </button>
                <button className="text-button" onClick={() => setMatch(null)}>
                  Keep discovering
                </button>
              </section>
            </div>
          )}
        </div>
      )}
    </>
  );
}
