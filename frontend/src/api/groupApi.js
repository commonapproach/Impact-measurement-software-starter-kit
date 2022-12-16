import {deleteJson, getJson, postJson, putJson} from "./index";

export async function fetchGroups(userTypes){
  if(userTypes.includes('superuser'))
    return getJson('/api/superuser/groups/');
  if(userTypes.includes('groupAdmin'))
    return getJson('/api/groupAdmin/groups/')
}

export async function deleteGroup(id) {
  return deleteJson('/api/superuser/group/' + id + '/');
}

export async function fetchGroup(id, userTypes) {
  if(userTypes.includes('superuser'))
    return getJson('/api/superuser/group/' + id + '/');
  if(userTypes.includes('groupAdmin'))
    return getJson('/api/groupAdmin/group/' + id + '/');
}

export async function updateGroup(id, params) {
  return putJson('/api/superuser/group/' + id + '/', params)
}

export async function createGroup(params) {
  return postJson('/api/superuser/group/', params);
}