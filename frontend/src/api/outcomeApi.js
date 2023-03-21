import {getJson, postJson, putJson} from "./index";

export async function fetchOutcomes(organizationId,) {
  return getJson('/api/outcomes/' + organizationId + '/');
}

export async function fetchOutcome(id) {
  return getJson('/api/outcome/' + id);
}

export async function createOutcome(params) {
  return postJson(`/api/outcome/`, params);
}

export async function updateOutcome(params, id) {
  return putJson(`/api/outcome/${id}`, params);
}