import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="p-12">
      <h1 className="text-2xl">Không tìm thấy trang</h1>
      <Link href="/">Về trang chủ</Link>
    </div>
  );
}
