"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The old Studio Editor was a hardcoded demo (fabricated persona, fake ATS
// scores, dead engine toggle). The real builder lives at /resume.
export default function StudioRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/resume');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F2] dark:bg-[#0A0A0C]">
      <p className="text-sm text-[#4A4A52] dark:text-[#A1A1AA]">
        The Studio Editor is now the Resume Builder - redirecting...
      </p>
    </div>
  );
}
