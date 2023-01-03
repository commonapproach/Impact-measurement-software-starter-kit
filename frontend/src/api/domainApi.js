import {deleteJson, getJson, postJson, putJson} from "./index";

export async function createDomain(params) {
  return postJson('/api/superuser/domain/', params);
}

export async function fetchDomains(params) {
  return getJson('/api/general/domains/', params);
}

export async function fetchDomain(id) {
  return getJson('/api/general/domain/' + id + '/')
}

export async function deleteDomain(id) {
  return deleteJson('/api/superuser/domain/' + id + '/');
}

export async function updateDomain(id, params) {
  return putJson('/api/superuser/domain/' + id + '/', params);
}