import {deleteJson, getJson} from "./index";

export async function fetchGroups(){
  return getJson('/api/superuser/groups/');
}

export async function deleteGroup(id) {
  return deleteJson('/api/superuser/group/' + id + '/');
}