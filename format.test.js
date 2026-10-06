import test from "node:test";
import assert from "node:assert/strict";
import { formatTemp, nextTrain } from "../format.js";

test("formatTemp returns -- when the station list is empty", () => {
  const data = {
    temperature: {
      data: []
    }
  };

  assert.equal(formatTemp(data), "--");
});

test("formatTemp finds Hong Kong Observatory when stations are not in a fixed order", () => {
  const data = {
    temperature: {
      data: [
        { place: "King's Park", value: 29, unit: "C" },
        { place: "Hong Kong Observatory", value: 30, unit: "C" }
      ]
    }
  };

  assert.equal(formatTemp(data), "30°C");
});

test("formatTemp returns -- when the Hong Kong Observatory station is missing", () => {
  const data = {
    temperature: {
      data: [{ place: "King's Park", value: 29, unit: "C" }]
    }
  };

  assert.equal(formatTemp(data), "--");
});

test("nextTrain formats an MTR ttnt string as minutes", () => {
  const service = {
    dest: "CHW",
    ttnt: "3",
    valid: "Y"
  };

  assert.equal(nextTrain(service, "Platform 1"), "Platform 1 · Chai Wan · 3 min");
});

test("nextTrain returns -- for an MTR response with status 0", () => {
  const response = {
    status: 0,
    message: "Invalid station",
    data: {}
  };

  assert.equal(nextTrain(response, "Platform 1"), "--");
});
