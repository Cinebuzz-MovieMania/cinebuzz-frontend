import { createContext, useContext, useState } from "react";

const CityContext = createContext(null);

export function CityProvider({ children }) {
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityPicker, setShowCityPicker] = useState(true);

  const selectCity = (city) => {
    setSelectedCity(city);
    setShowCityPicker(false);
  };

  const openCityPicker = () => {
    setShowCityPicker(true);
  };

  const clearCity = () => {
    setSelectedCity(null);
    setShowCityPicker(true);
  };

  return (
    <CityContext.Provider value={{ selectedCity, showCityPicker, selectCity, openCityPicker, clearCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used inside CityProvider");
  return ctx;
}
