import {postJson} from "./index";

export async function uploadFile(objects, organizationUri) {
  return postJson('/api/fileUploading', {objects, organizationUri});
}