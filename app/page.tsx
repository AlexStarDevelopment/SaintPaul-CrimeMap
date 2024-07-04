"use client";
import dynamic from "next/dynamic";
import Head from "next/head";
import { ChangeEvent, useState } from "react";
import ReactGA from "react-ga";
import { dataSelection, mappingSelection } from "./const";

ReactGA.initialize("G-8VSBZ6SFBZ");

const MyMap = dynamic(() => import("./components/map"), {
  ssr: false,
});

export default function Home() {
  const handleClick = () => {
    ReactGA.event({
      category: "Click",
      action: "coffeeClick",
      label: "coffee",
    });
    window.open("https://buy.stripe.com/fZeg14aol2JRgnu8ww", "_blank");
  };

  const [option, setOption] = useState<number>(mappingSelection.june24);
  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral text-neutral-content">
      <div className="navbar bg-primary text-primary-content">
        <div className="inline-block">
          <h1 className="btn btn-ghost text-lg">Saint Paul Crime Map</h1>
          <select
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setOption(Number(e.target.value))
            }
            className="select select-primary select-sm w-full max-w-xs"
            value={option}
          >
            {dataSelection.map((x) => {
              return (
                <option key={x.id} value={x.id}>
                  {x.month.toUpperCase() + " - " + x.year}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <div className="flex justify-center items-center h-[70vh] w-[75vw] border-2 m-2">
        <MyMap option={dataSelection[option]} />
      </div>
      <button className="btn btn-primary" onClick={handleClick}>
        Buy me a latte at Amore
      </button>
      <div className="card w-[100vw] bg-primary text-primary-content m-2">
        <div className="card-body items-center text-center">
          <h3 className="card-title">About</h3>
          <p className="m-5">
            My name is Alex and I live on the Westside in Saint Paul. I can
            never find good crime maps of Saint Paul, and the public data access
            spreadsheets are really buggy and hard to work with. I figured if I
            was having trouble navigating these resources, others would be too.
            Building this app, it was still very difficult to work with the data
            that the city provides, and I had to do a lot of cleanup to get the
            data usable for mapping on this app. I have spent many hours
            correcting incorrect data and looking up gps coordinates for cross
            streets by hand!
          </p>
          <p className="m-5">
            I have loved living here for the past 4 years and have never had any
            serious run-ins with crime. However, I like to stay informed! I make
            no claims with this app, and the purpose is not political or to
            perpetuate fear - it is simply to stay informed. If you like this
            app, please let me know. If you REALLY like it and want to buy me a
            cup of joe from Amore on Annapolis and Smith, I have included a
            button above. Please do not feel obligated and only do so if you
            want and are able! THANK YOU!
          </p>
        </div>
      </div>
      <div className="card w-[100vw] bg-primary text-primary-content m-5">
        <div className="card-body items-center text-center">
          <h3 className="card-title">Limitations</h3>
          <p className="m-5">
            Data provided by the city is not exact and locations are
            approximate. Addresses from the city are obfuscated for privacy so I
            round dates to the middle. Ex: 1XX Robert St will become 150 Robert
            St. Only crimes that have been reported and entered into the cities
            database will be displayed
          </p>
        </div>
      </div>
      <div className="card w-[100vw] bg-primary text-primary-content m-5">
        <div className="card-body items-center text-center">
          <h3 className="card-title">Change Log</h3>
          <p className="m-5">
            7/4/24 1.4.1 - Fixed loading issues for some years and limit 20k
            items to be returned until workaround is implemented for call size
            issues
          </p>
          <p className="m-5">7/3/24 1.4.0 - All data for 2014 - 2022 added.</p>
          <p className="m-5">
            7/2/24 1.3.0 - June 2024 data added. April, March, February, and
            January data added. All available for 2024 expanded to entire city.
            All 2023 data added.
          </p>
          <p className="m-5">
            6/20/24 1.2.0 - Expanded May 2024 data to include the entire city of
            Saint Paul. Widened text cards on desktop
          </p>
          <p className="m-5">
            6/19/24 1.1.0 - Added new dropdown feature which allows switching
            between May 2024 and All 2024 data available. Fixed minor issue with
            addresses on HALL. Crimes provided by the city via cross streets are
            now more accurate. Added change log.
          </p>
          <p className="m-5">
            6/18/24 1.0.2 - Added new icons for each offense
          </p>
          <p className="m-5">6/17/24 1.0.1 - Added dates to each offense</p>
          <p className="m-5">6/14/24 1.0.0 - Initial Release</p>
        </div>
      </div>
      <div className="card w-[100vw] bg-primary text-primary-content m-5">
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
