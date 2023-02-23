import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchGroups() {
  return getJson('/api/groups/');

}

export async function deleteGroup(id) {
  return deleteJson('/api/superuser/group/' + id + '/');
}

export async function fetchGroup(id) {
  return getJson(`/api/group/${id}/`)
}

export async function updateGroup(id, params) {
  return putJson('/api/group/' + id + '/', params);
}

export async function createGroup(params) {
  return postJson('/api/group/', params);
}