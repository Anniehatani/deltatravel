'use client';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-12">
      <h2>Có lỗi khi tải trang.</h2>
      <button className="underline" onClick={reset}>
        Thử lại
      </button>
    </div>
  );
}
