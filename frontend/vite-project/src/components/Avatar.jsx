import { useState } from "react";
export default function Avatar({ person, large = false }) {
  const [failedUrl, setFailedUrl] = useState("");
  return person?.profilePic && person.profilePic !== failedUrl ? (
    <img
      className={large ? "cover" : "avatar"}
      src={person.profilePic}
      alt={person.fullName}
      onError={() => setFailedUrl(person.profilePic)}
    />
  ) : (
    <div className={large ? "cover placeholder" : "avatar placeholder"}>
      {person?.fullName?.[0] || "♡"}
    </div>
  );
}
