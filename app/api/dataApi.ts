export async function getAllData() {
  const res = await fetch(
    "https://services1.arcgis.com/9meaaHE3uiba0zr8/arcgis/rest/services/Crime_Incident_Report_-_Dataset/FeatureServer/0/query?where=(DATE >= DATE '2023-08-14' AND DATE <= DATE '2023-08-14') AND (NEIGHBORHOOD_NUMBER == 3)&outFields=INCIDENT_TYPE,NEIGHBORHOOD_NUMBER,BLOCK,DATE&outSR=4326&f=json"
  );
  return res.json();
}
