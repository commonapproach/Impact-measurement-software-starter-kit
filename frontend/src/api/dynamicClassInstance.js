import {getJson} from "./index";

export async function getInstancesInClass(className) {
  return getJson('/api/general/dynamicClassInstances/' + className);
}