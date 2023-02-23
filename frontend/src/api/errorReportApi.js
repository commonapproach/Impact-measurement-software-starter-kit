import {postJson} from "./index";

export function reportErrorToBackend(e) {
  return postJson('/api/reportError/', {name: e.name, message: e.message, stack: e.stack});
}