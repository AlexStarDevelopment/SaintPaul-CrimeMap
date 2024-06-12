"use client";

import CustomData from "./api/test.json";
import dynamic from "next/dynamic";

const MyMap = dynamic(() => import("./components/map"), {
  ssr: false,
});

export default function Home() {
  // const fetchData = useMemo(() => async () => {
  //   const something = getAllData()
  //   something.then(i => console.log(i.features))
  // }, [])

  // useEffect(() => {
  //   fetchData();
  // }, [fetchData]);

  //console.log(CustomData.features);

  const crimeArray: Crime[] = [];

  const compileData = () => {
    CustomData.features.forEach((i) => {
      if (
        i.attributes.INCIDENT_TYPE !== "POLICE VISIT-PROACTIVE POLICE VISIT" &&
        i.attributes.INCIDENT_TYPE !== "COMMUNITY ORIENTED/OUTREACH EVENT " &&
        i.attributes.NEIGHBORHOOD_NUMBER === 3
      ) {
        const obj: Crime = {
          INCIDENT_TYPE: i.attributes.INCIDENT_TYPE,
          NEIGHBORHOOD_NUMBER: i.attributes.NEIGHBORHOOD_NUMBER.toString(),
          BLOCK: i.attributes.BLOCK,
          DATE: i.attributes.DATE.toString(),
        };
        console.log(obj);
        crimeArray.push(obj);
      }
    });
  };

  compileData();
  console.log(JSON.stringify(crimeArray));
  console.log(crimeArray.length);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Saint Paul Crime Map</h1>
      <MyMap />
    </main>
  );
}
