"use client";
import dynamic from "next/dynamic";
import Head from "next/head";

const MyMap = dynamic(() => import("./components/map"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="primary-content flex min-h-screen flex-col items-center p-24">
      <h1 className="text-lg">Saint Paul Crime Map</h1>
      <div className="flex justify-center items-center min-h-[31.25rem] min-w-[62.5rem] border-2 m-5">
        <MyMap />
      </div>

      <button className="btn btn-primary">Buy me a latte at Amore</button>
      <p className="m-5">
        City of Saint Paul Disclimer: This data is public domain. This data are
        provided to you “as is” and without any warranty as to their
        performance, merchantability, or fitness for any particular purpose. The
        City of Saint Paul does not represent or warrant that the data or the
        data documentation are error-free, complete, current, or accurate. You
        are responsible for any consequences resulting from your use of the data
        or your reliance on the data.
      </p>
    </main>
  );
}
