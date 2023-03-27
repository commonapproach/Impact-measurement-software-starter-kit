import {deleteJson, getJson, postJson, putJson} from "./index";

export async function createTheme(params) {
  return postJson('/api/theme/', params);
}

export async function fetchThemes(params) {
  return getJson('/api/themes/', params);
}

export async function fetchTheme(id) {
  return getJson('/api/theme/' + id + '/');
}

export async function deleteTheme(id) {
  return deleteJson('/api/theme/' + id + '/');
}

export async function updateTheme(id, params) {
  return putJson('/api/theme/' + id + '/', params);
}