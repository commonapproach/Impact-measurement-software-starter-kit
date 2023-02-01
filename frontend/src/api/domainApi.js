import {deleteJson, getJson, postJson, putJson} from "./index";

export async function createDomain(params) {
  return postJson('/api/domain/', params);
}

export async function fetchDomains(params) {
  return getJson('/api/domains/', params);
}

export async function fetchDomain(id) {
  return getJson('/api/domain/' + id + '/')
}

export async function deleteDomain(id) {
  return deleteJson('/api/domain/' + id + '/');
}

export async function updateDomain(id, params) {
  return putJson('/api/domain/' + id + '/', params);
}