"use client";
import dynamic from "next/dynamic";
import Head from "next/head";

const MyMap = dynamic(() => import("./components/map"), {
  ssr: false,
});

export default function Home() {
  const handleClick = () => {
    window.open("https://buy.stripe.com/fZeg14aol2JRgnu8ww", "_blank");
  };
  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral text-neutral-content">
      <div className="navbar bg-primary text-primary-content">
        <div className="inline-block">
          <h1 className="btn btn-ghost text-lg">
            Westside Saint Paul Crime Map
          </h1>
          <h2 className="pl-4">MAY 2024</h2>
        </div>
      </div>
      <div className="flex justify-center items-center h-[75vh] w-[80vw] border-2 m-5">
        <MyMap />
      </div>
      <button className="btn btn-primary" onClick={handleClick}>
        Buy me a latte at Amore
      </button>
      <div className="card w-96 bg-primary text-primary-content m-5">
        <div className="card-body items-center text-center">
          <h3 className="card-title">About</h3>
          <p className="m-5">
            My name is Alex! Thanks for visiting my app. I can never find good
            crime maps of Saint Paul, and the public data access spreadsheets
            are really buggy and hard to work with. Building this app, it was
            still very difficult to work with the data that the city provides,
            and I had to do a lot of cleanup to get the data usable for mapping.
            I figured if I was having trouble navigating these resources, others
            would be too. That was the inspiration behind building this app. I
            decided to start small with just my own neighborhood, The West Side!
            I have loved living here for the past 4 years and have never had any
            serious run-ins with crime. However, I like to stay informed! I make
            no claims with this app, and the purpose is not political - it is
            simply to stay informed. I assume you do too if you are reading
            this! This app is a proof of concept, and if you like it and want to
            see me continue building it, please let me know. If you REALLY like
            it and want to buy me a cup of joe from Amore on Annapolis and
            Smith, I have included a button above. Please do not feel obligated
            and only do so if you want and are able! THANK YOU!
          </p>
        </div>
      </div>
      <div className="card w-96 bg-primary text-primary-content m-5">
        <div className="card-body items-center text-center">
          <h3 className="card-title">Limitations</h3>
          <p className="m-5">
            Data provided by the city is not exact and locations are
            approximate. Addresses from the city are obfuscated for privacy so I
            round dates to the middle. Ex: 1XX Robert St will become 155 Robert
            St. Additionally, for some reason the gps lookup app does not like
            HALL AVE so I tried to find the nearest cross street address to some
            of the blocks on HALL.
          </p>
        </div>
      </div>
      <div className="card w-96 bg-primary text-primary-content m-5">
        <div className="card-body items-center text-center">
          <h3 className="card-title">Disclaimer</h3>
          <p className="m-5">
            City of Saint Paul Disclaimer: This data is public domain. This data
            are provided to you “as is” and without any warranty as to their
            performance, merchantability, or fitness for any particular purpose.
            The City of Saint Paul does not represent or warrant that the data
            or the data documentation are error-free, complete, current, or
            accurate. You are responsible for any consequences resulting from
            your use of the data or your reliance on the data.
          </p>
        </div>
      </div>
    </main>
  );
}
