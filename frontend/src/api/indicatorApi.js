import {getJson, postJson, putJson} from "./index";

export async function fetchIndicators(organizationId) {
  return getJson('/api/indicators/' + organizationId + '/');
}

export async function fetchIndicator(id) {
  return getJson('/api/indicator/' + id);
}

export async function createIndicator(params) {
  return postJson(`/api/indicator/`, params);
}

export async function updateIndicator(params, id) {
  return putJson(`/api/indicator/${id}`, params);
}