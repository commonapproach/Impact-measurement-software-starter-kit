import {getJson} from "./index";

export async function fetchUserTypes() {
  return getJson('/api/fetchUserTypes')
}