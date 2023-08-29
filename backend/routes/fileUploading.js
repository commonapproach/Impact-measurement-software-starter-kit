const express = require('express');
const {fileUploadingHandler} = require("../services/fileUploading/fileUploading");
const {newFileUploadingHandler} = require("../services/fileUploading/newFileUploading");



const router = express.Router({mergeParams: true});

router.post('/', newFileUploadingHandler);

module.exports = router;