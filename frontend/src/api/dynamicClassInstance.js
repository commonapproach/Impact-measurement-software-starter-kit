import {getJson} from "./index";

export async function getInstancesInClass(className) {
  return getJson('/api/dynamicClassInstances/' + className);
}