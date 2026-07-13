import { Suspense } from "react";

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-zinc-500">
          Loading…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
