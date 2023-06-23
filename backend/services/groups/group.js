const {GDBGroupModel} = require("../../models/group");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {GDBOrganizationModel} = require("../../models/organization");
const {hasAccess} = require("../../helpers/hasAccess");

const createGroupHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'createGroup'))
      return await createGroup(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};


const createGroup = async (req, res) => {

  const form = req.body;
  if (!form || !form.label || !form.administrator)
    return res.status(400).json({success: false, message: 'Wrong information given'});
  form.administrator = await GDBUserAccountModel.findOne({_uri: form.administrator}, {populates: 'groupAdminOfs'});
  if (!form.administrator)
    return res.status(400).json({success: false, message: 'Invalid administrator'});

  if (form.organizations && form.organizations.length > 0) {
    form.organizations = await Promise.all(form.organizations.map(organizationURI => {
      return GDBOrganizationModel.findOne({_uri: organizationURI});
    }));
  }
  delete form.uri
  const group = GDBGroupModel(form, form.uri?{uri: form.uri}:null);
  await group.save();

  // add the group to the admin's property
  if (!group.administrator.groupAdminOfs)
    group.administrator.groupAdminOfs = [];
  group.administrator.groupAdminOfs.push(group);
  await group.administrator.save();
  return res.status(200).json({success: true});

};

// const groupAdminFetchGroup = async (req, res, next) => {
//   try {
//     const {id} = req.params;
//     const sessionId = req.session._id;
//     if (!id)
//       return res.status(400).json({success: false, message: 'No id is given'});
//     const group = await GDBGroupModel.findOne({_id: id}, {populates: ['administrator']});
//     if (!group)
//       return res.status(400).json({success: false, message: 'No such group'});
//     if (group.administrator._id !== sessionId)
//       return res.status(400).json({success: false, message: 'You are not the admin of this group'});
//     return res.status(200).json({success: true, group: group});
//
//   } catch (e) {
//     next(e);
//   }
// };

const fetchGroupHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchGroup'))
      return await fetchGroup(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchGroup = async (req, res) => {
  const {uri} = req.params;
  if (!uri)
    return res.status(400).json({success: false, message: 'No uri is given'});
  const group = await GDBGroupModel.findOne({_uri: uri});
  if (!group)
    return res.status(400).json({success: false, message: 'No such group'});
  // if (group.administrator)
  //   group.administrator = group.administrator.split('_')[1];
  // if (group.organizations)
  //   group.organizations = group.organizations.map(organization => organization.split('_')[1]);
  group.uri = group._uri
  return res.status(200).json({success: true, group: group});

};

const updateGroupHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'updateGroup'))
      return await updateGroup(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const updateGroup = async (req, res) => {
  const {uri} = req.params;
  const form = req.body;
  if (!uri || !form)
    return res.status(400).json({success: false, message: 'Invalid information is given'});
  if (form.administrator)
    form.administrator = await GDBUserAccountModel.findOne({_uri: form.administrator});
  if (!form.administrator)
    return res.status(400).json({success: false, message: 'Invalid administrator'});
  if (form.organizations && form.organizations.length > 0)
    form.organizations = await Promise.all(form.organizations.map(organizationURI => {
      return GDBOrganizationModel.findOne({_uri: organizationURI});
    }));
  const group = await GDBGroupModel.findOne({_uri: uri}, {populates: ['administrator', 'organizations']});
  if (!group)
    return res.status(400).json({success: false, message: 'Invalid group id'});
  if (group.administrator._uri !== form.administrator._uri) {
    // the group admin have been changed
    // delete the group from previous admin's property
    const index = group.administrator.groupAdminOfs.findIndex(group => group === uri);
    if (index > -1)
      group.administrator.groupAdminOfs.splice(index, 1);
    await group.administrator.save();
    // add the group to new admin's property
    if (!form.administrator.groupAdminOfs)
      form.administrator.groupAdminOfs = [];
    form.administrator.groupAdminOfs.push(group);
    group.administrator = form.administrator
  }

  await group.administrator.save();
  group.organizations = form.organizations;
  group.label = form.label;
  group.comment = form.comment;
  await group.save();
  return res.status(200).json({success: true, message: 'Successfully updated group ' + uri});

};

const superuserDeleteGroup = async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'Invalid information is given'});
    await GDBGroupModel.findByIdAndDelete(id);
    return res.status(200).json({success: true, message: 'Successfully deleted group ' + id});
  } catch (e) {
    next(e);
  }
};


const groupAdminUpdateGroup = async (req, res, next) => {
  try {
    const {id} = req.params;
    const sessionId = req.session._id;
    const {comment, organizations} = req.body;
    if (!id)
      return res.status(400).json({success: false, message: 'No id is given'});
    const group = await GDBGroupModel.findOne({_id: id}, {populates: ['administrator']});
    if (!group)
      return res.status(400).json({success: false, message: 'No such group'});
    if (group.administrator._id !== sessionId)
      return res.status(400).json({success: false, message: 'You are not the admin of this group'});
    group.comment = comment;
    group.organizations = organizations;
    await group.save();
    return res.status(200).json({success: true, message: 'Successfully updated group ' + id});
  } catch (e) {
    next(e);
  }
};

module.exports = {
  createGroupHandler,
  fetchGroupHandler,
  updateGroupHandler,
  superuserDeleteGroup,
};