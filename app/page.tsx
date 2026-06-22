"use client";

import Script from "next/script";
import { useState } from "react";
import { BookingAppView } from "./_components/BookingAppView";
import { useBookingApp } from "./_hooks/useBookingApp";

export default function Home() {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const model = useBookingApp(googleLoaded);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleLoaded(true)}
      />
      <BookingAppView model={model} />
    </>
  );
}
