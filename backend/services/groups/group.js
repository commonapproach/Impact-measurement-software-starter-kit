const {GDBGroupModel} = require("../../models/group");
const {GDBUserAccountModel} = require("../../models/userAccount");
const {GDBOrganizationModel} = require("../../models/organization");
const createGroup = async (req, res, next) => {
  try {
    const form = req.body;
    if (!form || !form.label || !form.administrator)
      return res.status(400).json({success: false, message: 'Wrong information given'});
    form.administrator = await GDBUserAccountModel.findOne({_id: form.administrator}, {populates: 'groupAdminOfs'});
    if (!form.administrator)
      return res.status(400).json({success: false, message: 'Invalid administrator'});

    if (form.organizations && form.organizations.length > 0) {
      form.organizations = await Promise.all(form.organizations.map(organizationId => {
        return GDBOrganizationModel.findOne({_id:organizationId});
      }))
    }
    const group = GDBGroupModel(form);
    await group.save();

    // add the group to the admin's property
    if (!group.administrator.groupAdminOfs)
      group.administrator.groupAdminOfs = []
    group.administrator.groupAdminOfs.push(group);
    await group.administrator.save()
    return res.status(200).json({success: true});
  } catch (e) {
    next(e);
  }
};

const groupAdminFetchGroup = async (req, res, next) => {
  try {
    const {id} = req.params;
    const sessionId = req.session._id;
    if (!id)
      return res.status(400).json({success: false, message: 'No id is given'});
    const group = await GDBGroupModel.findOne({_id: id}, {populates: ['administrator']});
    if (!group)
      return res.status(400).json({success: false, message: 'No such group'});
    if (group.administrator._id !== sessionId)
      return res.status(400).json({success: false, message: 'You are not the admin of this group'});
    return res.status(200).json({success: true, group: group});

  } catch (e) {
    next(e);
  }
};

const superuserFetchGroup = async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id)
      return res.status(400).json({success: false, message: 'No id is given'});
    const group = await GDBGroupModel.findById(id);
    if (!group)
      return res.status(400).json({success: false, message: 'No such group'});
    if(group.administrator)
      group.administrator = group.administrator.split('_')[1]
    if(group.organizations)
      group.organizations = group.organizations.map(organization => organization.split('_')[1])
    return res.status(200).json({success: true, group: group});
  } catch (e) {
    next(e);
  }
};
const superuserUpdateGroup = async (req, res, next) => {
  try {
    const {id} = req.params;
    const form = req.body;
    if (!id || !form)
      return res.status(400).json({success: false, message: 'Invalid information is given'});
    if (form.administrator)
      form.administrator = await GDBUserAccountModel.findOne({_id: form.administrator})
    if(!form.administrator)
      return res.status(400).json({success: false, message: 'Invalid administrator'});
    if(form.organizations && form.organizations.length > 0)
      form.organizations = await Promise.all(form.organizations.map(organizationID => {
        return GDBOrganizationModel.findOne({_id: organizationID});
      }))
    const group = await GDBGroupModel.findOne({_id: id}, {populates: ['administrator']})
    if (!group)
      return res.status(400).json({success: false, message: 'Invalid group id'});
    if (group.administrator._id !== form.administrator._id){
      // the group admin have been changed
      // delete the group from previous admin's property
      const index = group.administrator.groupAdminOfs.findIndex(group => group.split('_')[1] === id);
      if (index > -1)
        group.administrator.groupAdminOfs.splice(index, 1);
      // add the group to new admin's property
      if(!form.administrator.groupAdminOfs)
        form.administrator.groupAdminOfs = [];
      form.administrator.groupAdminOfs.push(group);
    }

    await group.administrator.save();
    await GDBGroupModel.findByIdAndUpdate(id, form);
    return res.status(200).json({success: true, message: 'Successfully updated group ' + id});
  } catch (e) {
    next(e);
  }
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
  groupAdminUpdateGroup,
  createGroup,
  superuserFetchGroup,
  superuserUpdateGroup,
  superuserDeleteGroup,
  groupAdminFetchGroup
};