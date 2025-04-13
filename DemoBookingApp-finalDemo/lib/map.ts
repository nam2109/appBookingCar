import { Driver, MarkerData } from "@/types/type";
import polyline from "@mapbox/polyline";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface GraphHopperResponse {
  paths?: {
    distance: number;
    time: number;
    points: string;
    points_encoded: boolean;
  }[];
  message?: string;
}

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 37.421425, // DH VL
      longitude: -122.094718, // DH VL
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  )
    return;

  const start = `${userLatitude},${userLongitude}`;
  const end = `${destinationLatitude},${destinationLongitude}`;

  const url = `https://graphhopper.com/api/1/route?point=${start}&point=${end}&vehicle=car&locale=en&key=${process.env.EXPO_PUBLIC_GRAPH_HOOKER_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = (await response.json()) as GraphHopperResponse;
    if (!data.paths || data.paths.length === 0) {
      return null;
    }
    const path = data.paths[0];
    const distance = path.distance / 1000;
    const time = Math.round(parseFloat(path.time / 1000 / 60 + ""));
    const decodedPoints = polyline.decode(path.points, 5);
    const coordinates: Coordinate[] = decodedPoints.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));

    const timesPromises = markers.map(async (marker) => {
      // const responseToUser = await fetch(
      //     `https://maps.googleapis.com/maps/api/directions/json?origin=${marker.latitude},${marker.longitude}&destination=${userLatitude},${userLongitude}&key=${directionsAPI}`,
      // );
      // const dataToUser = await responseToUser.json();
      // const timeToUser = dataToUser.routes[0].legs[0].duration.value; // Time in seconds

      // const responseToDestination = await fetch(
      //     `https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&key=${directionsAPI}`,
      // );
      // const dataToDestination = await responseToDestination.json();
      // const timeToDestination =
      //     dataToDestination.routes[0].legs[0].duration.value; // Time in seconds

      // const totalTime = (timeToUser + timeToDestination) / 60; // Total time in minutes
      // const price = (totalTime * 0.5).toFixed(2); // Calculate price based on time

      return { ...marker, time: time, distance };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error fetching route:", error);
  }

  // Calc price time

  // try {
  //     const timesPromises = markers.map(async (marker) => {
  //         const responseToUser = await fetch(
  //             `https://maps.googleapis.com/maps/api/directions/json?origin=${marker.latitude},${marker.longitude}&destination=${userLatitude},${userLongitude}&key=${directionsAPI}`,
  //         );
  //         const dataToUser = await responseToUser.json();
  //         const timeToUser = dataToUser.routes[0].legs[0].duration.value; // Time in seconds

  //         const responseToDestination = await fetch(
  //             `https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&key=${directionsAPI}`,
  //         );
  //         const dataToDestination = await responseToDestination.json();
  //         const timeToDestination =
  //             dataToDestination.routes[0].legs[0].duration.value; // Time in seconds

  //         const totalTime = (timeToUser + timeToDestination) / 60; // Total time in minutes
  //         const price = (totalTime * 0.5).toFixed(2); // Calculate price based on time

  //         return {...marker, time: totalTime, price};
  //     });

  //     return await Promise.all(timesPromises);
  // } catch (error) {
  //     console.error("Error calculating driver times:", error);
  // }
};

export const calculateCost = async ({
  startLat,
  startLog,
  endLat,
  endLog,
}: {
  startLat: number | null;
  startLog: number | null;
  endLat: number | null;
  endLog: number | null;
}) => {
  if (!startLat || !startLog || !endLat || !endLog) return;
  const start = `${startLat},${startLog}`;

  const end = `${endLat},${endLog}`;

  const url = `https://graphhopper.com/api/1/route?point=${start}&point=${end}&vehicle=car&locale=en&key=${process.env.EXPO_PUBLIC_GRAPH_HOOKER_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as GraphHopperResponse;
    if (!data.paths || data.paths.length === 0) {
      return null;
    }
    const path = data.paths[0];
    const distance = path.distance / 1000;
    const time = path.time / 1000 / 60;
    const decodedPoints = polyline.decode(path.points, 5);
    const coordinates: Coordinate[] = decodedPoints.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));
    return {
      distance: distance,
      time: time,
      coordinates: coordinates,
    };
  } catch (error) {
    console.log(error);
    return;
  }
};
