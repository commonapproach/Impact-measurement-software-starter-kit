import {deleteJson, getJson, postJson} from "./index";

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
  return deleteJson('/api/superuser/domain/' + id + '/')
}