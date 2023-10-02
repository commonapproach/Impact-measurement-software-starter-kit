const {hasAccess} = require("../../helpers/hasAccess");
const {Server400Error} = require("../../utils");
const {GDBOrganizationModel, GDBStakeholderOrganizationModel} = require("../../models/organization");
const {GDBStakeholderModel} = require("../../models/stakeholder");

const fetchStakeholderHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholder'))
      return await fetchStakeholder(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

const fetchStakeholderInterfaceHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'fetchStakeholderInterface'))
      return await fetchStakeholderInterface(req, res);
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    next(e);
  }
};

async function fetchStakeholderInterface(req, res) {
  const stakeholders = await GDBStakeholderModel.find({});
  const stakeholderInterfaces = {}
  stakeholders.map(stakeholder => {
    stakeholderInterfaces[stakeholder._uri] = stakeholder.name
  });
  return res.status(200).json({success: true, stakeholderInterfaces});
}


async function fetchStakeholder(req, res) {
  const {uri} = req.params;
  if (!uri)
    throw new Server400Error('Stakeholder uri is needed');
  const stakeholder = await GDBStakeholderOrganizationModel.findOne({_uri: uri},
    {populates: ['hasIds.issuedBy', 'hasOutcomes', 'hasIndicators', 'telephone', 'administrator.person', 'researchers.person', 'editors.person']});
  if (!stakeholder)
    throw new Server400Error('No such stakeholder');
  const outcomes = stakeholder.hasOutcomes || [];
  // if (outcomes.length > 0) {
  //   outcomes.map(outcome => {
  //     outcome.theme = outcome.theme.split('_')[1];
  //   });
  // }
  const indicators = stakeholder.hasIndicators || [];
  stakeholder.organizationNumber = stakeholder.hasId?.hasIdentifier;
  stakeholder.issuedBy = stakeholder.hasId?.issuedBy._uri;
  stakeholder.issuedByName = stakeholder.hasId?.issuedBy.legalName;
  if (stakeholder.administrator) {
    const administrator = stakeholder.administrator;
    stakeholder.administrator = administrator._uri;
    stakeholder.administratorName = administrator.person.givenName + ' ' + administrator.person.familyName;
  }

  if (!stakeholder.researchers) {
    stakeholder.researchers = [];
  } else {
    stakeholder.researcherNames = {};
    stakeholder.researchers = stakeholder.researchers.map(researcher => {
      stakeholder.researcherNames[researcher._uri] = researcher.person.givenName + ' ' + researcher.person.familyName;
      return researcher._uri;
    });
  }

  if (!stakeholder.reporters) {
    stakeholder.reporters = [];
  } else {
    stakeholder.reporterNames = {};
    stakeholder.reporters = stakeholder.reporters.map(reporter => {
      stakeholder.reporterNames[reporter._uri] = reporter.person.givenName + ' ' + reporter.person.familyName;
      return reporter._uri;
    });
  }

  if (!stakeholder.editors) {
    stakeholder.editors = [];
  } else {
    stakeholder.editorNames = {};
    stakeholder.editors = stakeholder.editors.map(editor => {
      stakeholder.editorNames[editor._uri] = editor.person.givenName + ' ' + editor.person.familyName;
      return editor._uri;
    });
  }


  delete stakeholder.hasOutcomes;
  delete stakeholder.hasId;
  delete stakeholder.hasIndicators;
  return res.status(200).json({success: true, stakeholder, outcomes, indicators});
}

async function createStakeholderHandler(req, res, next) {
  try {
    if (await hasAccess(req, 'createStakeholder')) {
      return await createStakeholder(req, res);
    } else {
      return res.status(400).json({message: 'Wrong Auth'});
    }
  } catch (e) {
    next(e);
  }
}

async function updateStakeholderHandler(req, res, next) {
  try {
    if (await hasAccess(req, 'updateStakeholder')) {
      return await updateStakeholder(req, res);
    } else {
      return res.status(400).json({message: 'Wrong Auth'});
    }
  } catch (e) {
    next(e);
  }
}

async function updateStakeholder(req, res) {
  const {uri} = req.params;
  if (!uri)
    throw new Server400Error('Stakeholder uri is needed');
  const {form} = req.body;
  if (!form || !form.description || !form.name || !form.catchmentArea || !['local', 'provincial', 'national', 'multinational', 'global'].includes(form.catchmentArea)){
    throw new Server400Error('Wrong information input');
  }
  const targetStakeholder = await GDBStakeholderOrganizationModel.findOne({_uri: uri});
  if (!targetStakeholder)
    throw new Server400Error('No such stakeholder');
  targetStakeholder.description = form.description;
  targetStakeholder.name = form.name;
  targetStakeholder.catchmentArea = form.catchmentArea;
  await targetStakeholder.save();
  return res.status(200).json({success: true, message: 'Successfully update stakeholder ' + form.name});
}


async function createStakeholder(req, res) {
  const {form} = req.body;
  if (!form)
    throw new Server400Error('Wrong information input');
  if (!form.organization || !form.description || !form.name || !form.catchmentArea || !['local', 'provincial', 'national', 'multinational', 'global'].includes(form.catchmentArea)) {
    throw new Server400Error('Wrong information input');
  }
  const targetOrganization = await GDBOrganizationModel.findOne({_uri: form.organization});
  if (!targetOrganization)
    throw new Server400Error('No such organization');

  const stakeHolder = GDBStakeholderOrganizationModel({
    comment: targetOrganization.comment,
    hasUsers: targetOrganization.hasUsers,
    administrator: targetOrganization.administrator,
    reporters: targetOrganization.reporters,
    editors: targetOrganization.editors,
    researchers: targetOrganization.researchers,
    legalName: targetOrganization.legalName,
    hasIds: targetOrganization.hasIds,
    hasIndicators: targetOrganization.hasIndicators,
    hasOutcomes: targetOrganization.hasOutcomes,
    telephone: targetOrganization.telephone,
    contactName: targetOrganization.contactName,
    email: targetOrganization.email,

    // its own property
    description: form.description,
    catchmentArea: form.catchmentArea,
    name: form.name,
  }, {uri: targetOrganization._uri});

  await stakeHolder.save();

  return res.status(200).json({success: true, message: 'Successfully create stakeholder ' + form.name});

}

module.exports = {
  createStakeholderHandler,
  fetchStakeholderHandler,
  updateStakeholderHandler,
  fetchStakeholderInterfaceHandler
};