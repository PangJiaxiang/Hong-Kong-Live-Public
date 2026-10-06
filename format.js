export function formatTemp(data) {
  const reading = data.temperature.data.find(
    (item) => item.place === "Hong Kong Observatory"
  );
  if (!reading) {
    return "--";
  }

  return `${reading.value}°${reading.unit}`;
}

export function formatAqhi(reading) {
  return `AQHI ${reading.aqhi} · ${reading.health_risk}`;
}

export function nextTrain(service, direction) {
  if (service.status === 0 || !service.dest || !Number.isFinite(Number(service.ttnt))) {
    return "--";
  }

  const destinationNames = {
    CHW: "Chai Wan",
    KET: "Kennedy Town"
  };
  const destination = destinationNames[service.dest] || service.dest;
  const minutes = Number(service.ttnt);
  const arrival = minutes === 0 ? "Arriving now" : `${minutes} min`;
  return `${direction} · ${destination} · ${arrival}`;
}
