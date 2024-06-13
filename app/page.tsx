"use client";
import dynamic from "next/dynamic";

const MyMap = dynamic(() => import("./components/map"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Saint Paul Crime Map</h1>
      <MyMap />
      <p>
        Public Domain: This data are provided to you “as is” and without any
        warranty as to their performance, merchantability, or fitness for any
        particular purpose. The City of Saint Paul does not represent or warrant
        that the data or the data documentation are error-free, complete,
        current, or accurate. You are responsible for any consequences resulting
        from your use of the data or your reliance on the data.
      </p>
    </main>
  );
}
