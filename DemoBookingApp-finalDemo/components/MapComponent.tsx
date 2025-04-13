import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import "../global.css";
import { useDriverStore, useLocationStore } from "@/store";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { drivers } from '../utils/datadummy';
import { icons } from "@/constants";
import { Coordinate, MarkerData } from "@/types/type";

const MapComponent: React.FC = () => {


  const {
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
    routeMap
  } = useLocationStore();

  const region = calculateRegion({
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  });

  const { selectedDriver, setDrivers } = useDriverStore();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [startPoint, setStartPoint] = useState<Coordinate | null>(null);
  const [endPoint, setEndPoint] = useState<Coordinate | null>(null);
  const [error, setError] = useState(null)
  useEffect(() => {
    if (Array.isArray(drivers)) {
      if (!userLatitude || !userLongitude) return;

      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude,
        userLongitude,
      });

      setMarkers(newMarkers);
    }
  }, [drivers]);

  useEffect(() => {
    if (markers.length > 0 && destinationLatitude && destinationLongitude) {
      calculateDriverTimes({
        markers,
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
      }).then((drivers) => {
        setDrivers(drivers as MarkerData[]);
      });
    }
  }, [markers, destinationLatitude, destinationLongitude]);

  useEffect(() => {
    if (!userLatitude || !userLongitude) return
    const startPoint : Coordinate = {
      latitude: userLatitude,
      longitude: userLongitude
    }
    setStartPoint(startPoint)
  }, [userLatitude, userLongitude]);

  useEffect(() => {
    if (!destinationLatitude || !destinationLongitude) return
    const endPoint : Coordinate = {
      latitude: destinationLatitude,
      longitude: destinationLongitude
    }
    setEndPoint(endPoint)
  }, [destinationLatitude, destinationLongitude]);


  if (!userLatitude || !userLongitude) {
    return (
      <View className="flex justify-between items-center w-full">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  if (error) {
    <View className="flex justify-between items-center w-full">
      <Text>Error: {error}</Text>
    </View>
  }

  return (
    <View style={styles.container}>
      {/* Bản đồ */}
      <MapView
        provider={PROVIDER_DEFAULT}
        className="w-full h-full rounded-2xl"
        tintColor="black"
        showsPointsOfInterest={false}
        style={styles.map}
        key={routeMap ? routeMap.length : 0} // Thay đổi key để ép render
        // region={route && startPoint && endPoint ? "calculateRegion(route)" : {
        //     latitude: 10.7769,
        //     longitude: 106.7009,
        //     latitudeDelta: 2,
        //     longitudeDelta: 2,
        // }}
        initialRegion={region}
        // showsUserLocation={true}
        userInterfaceStyle="light"
      >
        {markers &&
          markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              title={marker.title}
              image={
                selectedDriver === marker.id
                  ? icons.selectedMarker
                  : icons.marker
              }
            />
          ))}
        {startPoint && (
          <Marker coordinate={startPoint} title="Điểm bắt đầu" pinColor="red" />
        )}
        {endPoint && (
          <Marker
            coordinate={endPoint}
            title="Điểm kết thúc"
            pinColor="green"
          />
        )}
        {routeMap && (
          <Polyline
            coordinates={routeMap}
            strokeColor="#FF0000"
            strokeWidth={3}
            zIndex={2}
          />
        )}
      </MapView>

      {/* Thông tin quãng đường và thời gian */}
      {error && (
        <View style={styles.error}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  autocompleteContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1000, // Tăng zIndex để nằm trên bản đồ
  },
  autocompleteContainer_End: {
    position: "absolute",
    top: 60, // Khoảng cách đủ để không đè lên danh sách gợi ý của điểm bắt đầu
    left: 10,
    right: 10,
    zIndex: 900, // Thấp hơn điểm bắt đầu để tránh đè lên danh sách gợi ý
  },
  textInput: {
    height: 40,
    backgroundColor: "white",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    zIndex: 1100, // Đảm bảo ô nhập liệu nằm trên danh sách gợi ý
  },
  suggestionList: {
    maxHeight: 150,
    backgroundColor: "white",
    borderRadius: 5,
    elevation: 3,
    zIndex: 1200, // Cao hơn cả hai ô nhập liệu để hiển thị rõ
    position: "absolute",
    top: 50, // Đặt ngay dưới ô nhập liệu
    left: 0,
    right: 0,
  },
  suggestionText: {
    padding: 10,
    color: "#333",
  },
  info: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  error: {
    position: "absolute",
    top: 110,
    left: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
});

export default MapComponent;
