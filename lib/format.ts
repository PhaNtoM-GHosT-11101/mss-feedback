export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function statusLabel(status: string): string {
  switch (status) {
    case "new":
      return "New";
    case "in_progress":
      return "In review";
    case "resolved":
      return "Resolved";
    default:
      return status;
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "new":
      return "badge badge-new";
    case "in_progress":
      return "badge badge-in_progress";
    case "resolved":
      return "badge badge-resolved";
    default:
      return "badge bg-gray-100 text-gray-700";
  }
}
