import {postJson} from "./index";

export async function uploadFile(objects, organizationId) {
  return postJson('/api/fileUploading', {objects, organizationId});
}