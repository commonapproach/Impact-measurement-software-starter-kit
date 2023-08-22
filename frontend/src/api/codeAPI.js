import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchCodes() {
  return getJson('/api/codes/');
}

export async function fetchCode(uri) {
  return getJson('/api/code/' + uri);
}

export async function createCode(params) {
  return postJson('/api/code/', params);
}

export async function updateCode(uri, params) {
  return putJson('/api/code/' + uri, params);
}

export async function deleteOrganization(id) {
  return deleteJson('/api/superuser/organization/' + id);
}