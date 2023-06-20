import {postJson} from "./index";

export async function uploadFile(objects, organizationUri, fileName) {
  return postJson('/api/fileUploading', {objects, organizationUri, fileName});
}