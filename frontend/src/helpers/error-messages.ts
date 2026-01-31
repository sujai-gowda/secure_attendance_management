type ErrorLike = { message?: string; status?: number; response?: { status?: number; data?: { error?: string } } };

function getStatus(err: unknown): number | undefined {
  if (err && typeof err === "object") {
    const e = err as ErrorLike;
    if (typeof e.status === "number") return e.status;
    if (e.response && typeof e.response.status === "number") return e.response.status;
  }
  return undefined;
}

function getMessage(err: unknown): string | undefined {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as ErrorLike).message === "string") {
    return (err as ErrorLike).message;
  }
  const e = err as ErrorLike;
  if (e?.response?.data?.error && typeof e.response.data.error === "string") return e.response.data.error;
  return undefined;
}

export interface ActionableError {
  title: string;
  description: string;
}

const NETWORK_DESCRIPTION = "Check your internet connection and try again.";
const RETRY_DESCRIPTION = "Please try again in a moment.";
const LOGIN_AGAIN_DESCRIPTION = "Please log in again to continue.";

export function getErrorMessage(err: unknown, context?: string): ActionableError {
  const status = getStatus(err);
  const message = getMessage(err);

  if (status === 0 || message?.toLowerCase().includes("network")) {
    return {
      title: "Connection problem",
      description: NETWORK_DESCRIPTION,
    };
  }

  switch (status) {
    case 401:
      return {
        title: "Session expired",
        description: LOGIN_AGAIN_DESCRIPTION,
      };
    case 403:
      return {
        title: "Access denied",
        description: "You don’t have permission for this. Contact an admin if you think this is a mistake.",
      };
    case 404:
      return {
        title: "Not found",
        description: context === "search" || context === "records"
          ? "No results match your search. Try different filters or criteria."
          : "The requested item wasn’t found. It may have been removed.",
      };
    case 422:
    case 400:
      return {
        title: "Invalid input",
        description: message && message.length < 120 ? `${message} Check your input and try again.` : "Check your input and try again.",
      };
    case 429:
      return {
        title: "Too many requests",
        description: "You’re making requests too quickly. Wait a moment, then try again.",
      };
    case 500:
    case 502:
    case 503:
      return {
        title: "Server error",
        description: "Something went wrong on our side. Please try again in a few minutes.",
      };
    default:
      break;
  }

  if (message && message.length > 0 && message.length < 150) {
    return {
      title: "Something went wrong",
      description: message.endsWith(".") ? message : `${message}. ${RETRY_DESCRIPTION}`,
    };
  }

  const fallbacks: Record<string, string> = {
    login: "Check your username and password, then try again.",
    attendance: "Check your entries and try again. If it keeps failing, refresh the page.",
    records: "Try different search criteria or try again later.",
    search: "Check the roll number and try again.",
    analytics: "Refresh the page to load analytics again.",
    integrity: "Refresh the page to run the integrity check again.",
    classroom: "Refresh the page or try again. If the problem continues, contact support.",
    addClass: "Check the class details and try again.",
  };

  const suggestion = context ? fallbacks[context] : RETRY_DESCRIPTION;
  return {
    title: "Something went wrong",
    description: suggestion,
  };
}
