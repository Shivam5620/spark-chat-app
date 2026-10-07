import { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { api, errorText } from "../api";
import Avatar from "./Avatar";
export default function Chat({ user, person, socket }) {
  const [messages, setMessages] = useState([]),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const bottom = useRef(null);
  useEffect(() => {
    let active = true;
    const queued = [];
    const receive = (message) => {
      if ([message.senderId, message.receiverId].includes(person._id)) {
        queued.push(message);
        setMessages((old) =>
          old.some((x) => x._id === message._id) ? old : [...old, message],
        );
      }
    };
    socket?.on("newMessage", receive);
    api
      .get(`/messages/${person._id}`)
      .then(({ data }) => {
        if (active)
          setMessages([
            ...new Map([...data, ...queued].map((m) => [m._id, m])).values(),
          ]);
      })
      .catch((err) => {
        if (active) setError(errorText(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      socket?.off("newMessage", receive);
    };
  }, [person._id, socket]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);
  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/messages/send/${person._id}`, {
        message: text,
      });
      setMessages((old) =>
        old.some((x) => x._id === data._id) ? old : [...old, data],
      );
      setText("");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="chat panel">
      <header>
        <Avatar person={person} />
        <div>
          <strong>{person.fullName}</strong>
          <small>You matched. Say something lovely.</small>
        </div>
      </header>
      <div className="chat-log">
        {loading && <p>Loading conversation…</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && !messages.length && (
          <div className="empty">
            <FiMessageCircle />
            <h3>Every story starts with hello.</h3>
            <p>Ask about something on their profile.</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m._id}
            className={`bubble ${m.senderId === user._id ? "mine" : ""}`}
          >
            {m.message}
            <small>
              {new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form className="composer" onSubmit={send}>
        <input
          aria-label="Message"
          placeholder="Say hello…"
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="primary"
          disabled={busy || !text.trim()}
          aria-label="Send message"
        >
          <FiSend />
        </button>
      </form>
    </section>
  );
}
