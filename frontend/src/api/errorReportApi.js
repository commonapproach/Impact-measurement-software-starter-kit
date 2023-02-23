import {postJson} from "./index";

export async function reportError(e) {
  return postJson('/api/reportError/', {name: e.name, message: e.message, stack: e.stack});
}