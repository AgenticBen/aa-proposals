import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <Image
          src="/brand/logo-light.png"
          alt="Agentic Arc"
          width={220}
          height={45}
          className="mx-auto mb-10"
          priority
        />
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 bg-cyan text-navy font-body font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-cyan/90 transition-colors"
        >
          Admin Login →
        </Link>
      </div>
    </div>
  );
}
