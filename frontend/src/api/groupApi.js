import {deleteJson, getJson, postJson} from "./index";

export async function fetchGroups(){
  return getJson('/api/superuser/groups/');
}

export async function deleteGroup(id) {
  return deleteJson('/api/superuser/group/' + id + '/');
}

export async function fetchGroup(id) {
  return getJson('/api/superuser/group/' + id + '/');
}

export async function createGroup(params) {
  return postJson('/api/superuser/group/', params);
}