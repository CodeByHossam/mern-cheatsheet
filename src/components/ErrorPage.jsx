// src/components/ErrorPage.jsx
import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  let message = "Something went wrong.";
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h1 className="text-3xl font-bold">Oops!</h1>
      <p className="text-gray-600">{message}</p>
      <Link to="/" className="btn-primary">
        Go Home
      </Link>
    </div>
  );
}
