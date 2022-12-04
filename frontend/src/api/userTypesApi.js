import {getJson} from "./index";

export async function fetchUserTypes() {
  return getJson('/api/general/userTypes/fetchUserTypes')
}