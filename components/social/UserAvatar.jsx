function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export function UserAvatar({ name, url, className = "h-12 w-12 text-base" }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={`${className} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-orange-100 font-extrabold text-orange-800`}
      aria-hidden="true"
    >
      {initials(name) || "؟"}
    </div>
  );
}
