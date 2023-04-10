const express = require('express');
const {fileUploadingHandler} = require("../services/fileUploading/fileUploading");



const router = express.Router({mergeParams: true});

router.post('/', fileUploadingHandler);

module.exports = router;