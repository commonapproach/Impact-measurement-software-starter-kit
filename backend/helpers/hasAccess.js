const {GDBUserAccountModel} = require("../models/userAccount");
const {Server400Error} = require("../utils");
const {GDBOrganizationModel} = require("../models/organization");
const {GDBGroupModel} = require("../models/group");
const {GDBIndicatorModel} = require("../models/indicator");
const {GDBOutcomeModel} = require("../models/outcome");
const {GDBIndicatorReportModel} = require("../models/indicatorReport");
const {
  organizationBelongsToGroupAdmin,
  organizationBelongsToUser,
  isReachableBy,
  isAPartnerOrganization, allReachableOrganizations
} = require("./index");

/**
 * the function is a middleware returns a bool indicating
 * if the user has access to the operation
 * @param req user's request
 * @param operationType a string describes the operation
 */
async function hasAccess(req, operationType) {
  const userAccount = await GDBUserAccountModel.findOne({_uri: req.session._uri});
  if (!userAccount)
    throw new Server400Error('Wrong auth');
  switch (operationType) {
    case 'reportFrontendError':
      return true;
    case 'fileUploading':
      return true; // todo: only editors can upload files
      break;
    // users
    case 'inviteNewUser':
      return userAccount.isSuperuser;
    case 'fetchProfile':
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'updateProfile':
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'fetchUser':
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'updateUser':
      if (userAccount.isSuperuser)
        return true;
      break;

    // characteristic
    case 'createCharacteristic':
      if (userAccount.isSuperuser)
        return true;
      break

    // characteristic
    case 'fetchCharacteristics':
      return true;
      break

    case 'fetchCharacteristic':
      return true;
      break

    // stakeholderOutcomes
    case 'fetchStakeholderOutcomes':
      return true;
      break


    // code
    case 'createCode':
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'fetchCode':
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'updateCode':
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'fetchCodes':
      if (userAccount.isSuperuser)
        return true;


    // stakeholder
    case 'createStakeholder':
      return userAccount.isSuperuser;

    case 'fetchStakeholders':
      if (userAccount.isSuperuser)
        return true;
      break;

    case 'fetchStakeholder':
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'fetchStakeholderInterface':
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'updateStakeholder':
      if (userAccount.isSuperuser)
        return true;
      break;


    // organizations
    case 'createOrganization':
      return userAccount.isSuperuser;
    case 'updateOrganization':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.administratorOfs) {
        const organizationUri = req.params.uri;
        const form = req.body.form;
        // firstly check is the user administrating the organization
        if (organizationBelongsToUser(userAccount, organizationUri, 'administratorOfs')) {
          // then check is the user updating the restricted properties
          const organization = await GDBOrganizationModel.findOne({_uri: organizationUri}, {populates: ['hasId']});
          if (organization.administrator === form.administrator && organization.legalName === form.legalName
          && organization.hasId.hasIdentifier === form.organizationNumber)
            return true;
        }
      }
      break;
    case 'fetchOrganization':
      if (userAccount.isSuperuser)
        return true;

      // check if the userAccount is associated with the organization
      const organizationUri = req.params.uri;
      const organizations = await allReachableOrganizations(userAccount);
      const checkerList = organizations.filter(organization => organization._uri === organizationUri);
      if (checkerList.length)
        return true;

      break;
    case 'fetchOrganizations':
      // every users should be able to fetch organizations,
      // however, the ret they got are different depends on their role
      return true;
      break;

    case 'fetchOrganizationsInterfaces':
      // every user should be able to see the interfaces of all organizations
      return true;
      break;

    // groups
    case 'fetchGroups':
      // if (userAccount.isSuperuser)
      //   return true;
      // if (userAccount.groupAdminOfs)
      //   return true;
      return true; // give every users access
      break;
    case 'createGroup':
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'updateGroup':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs) {
        // only allow groupAdmin to remove organizations as well as
        const {uri} = req.params;
        const form = req.body;
        if (!uri || !form)
          throw new Server400Error('Invalid input')
        const group = await GDBGroupModel.findOne({_uri:uri})
        if (!group)
          throw new Server400Error('No such group')
        if (form.label === group.label && form.administrator === group.administrator){
          // label and administrator cannot be changed
          const previousOrganizationUris = group.organizations
          const checkerList = form.organizations.map(organizationUri => {
            return previousOrganizationUris.includes(organizationUri)
          })
          if(!checkerList.includes(false))
            return true;
        }
      }
      break;
    case 'fetchGroup':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs) {
        // check does the group administrated by the user
        const {uri} = req.params;
        if (userAccount.groupAdminOfs.includes(uri))
          return true;
      }
      break;


    // users
    case 'fetchUsers': // todo
      return true;

    // indicators
    case 'fetchIndicators':
      return true; // todo: to be removed later
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs) {
        // pass if the organization belongs to the group administrated by the groupAdmin
        const {organizationUri} = req.params;
        if (!organizationUri)
          throw new Server400Error('organizationUri is needed');
        if (await organizationBelongsToGroupAdmin(userAccount, organizationUri))
          return true;
      }
      if (userAccount.administratorOfs) {
        // pass if the organization belongs to the userAccount
        const {organizationUri} = req.params;
        if (!organizationUri)
          throw new Server400Error('organizationUri is needed');
        if (organizationBelongsToUser(userAccount, organizationUri, 'administratorOfs'))
          return true;
      }
      if (userAccount.researcherOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationUri} = req.params;
        if (!organizationUri)
          throw new Server400Error('organizationUri is needed');
        if (await isAPartnerOrganization(organizationUri, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.editorOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationUri} = req.params;
        if (!organizationUri)
          throw new Server400Error('organizationUri is needed');
        if (await isAPartnerOrganization(organizationUri, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.reporterOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationUri} = req.params;
        if (!organizationUri)
          throw new Server400Error('organizationUri is needed');
        if (await isAPartnerOrganization(organizationUri, userAccount, 'reporterOfs'))
          return true;
      }

      break;
    case 'fetchIndicator':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs?.length > 0) {
        // check does the indicator belong to an organization belongs to a group belongs to the user

        // fetch the indicator from the database
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');

        // fetch all groups belong to the user
        const groups = await Promise.all(userAccount.groupAdminOfs.map(groupURI => {
            return GDBGroupModel.findOne({_uri: groupURI}, {populates: ['organizations']});
          }
        ));
        for (let group of groups) {
          // fetch all organizations belongs to the group
          // group.organizations = await Promise.all(group.organizations.map(organizationURI => {
          //   return GDBOrganizationModel.findOne({_id: organizationURI.split('_')[1]});
          // }));
          // check if there any organization contain the indicator
          for (let organization of group.organizations) {
            if (organization.hasIndicators.includes(uri))
              return true;
          }
        }
      }
      if (userAccount.editorOfs) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const indicator = await GDBIndicatorModel.findOne({_uri: uri});
        if (!indicator)
          throw new Server400Error('No such indicator');

        if (await isReachableBy(indicator, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.researcherOfs) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const indicator = await GDBIndicatorModel.findOne({_uri: uri});
        if (!indicator)
          throw new Server400Error('No such indicator');

        if (await isReachableBy(indicator, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.reporterOfs) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const indicator = await GDBIndicatorModel.findOne({_uri: uri});
        if (!indicator)
          throw new Server400Error('No such indicator');
        if (await isReachableBy(indicator, userAccount, 'reporterOfs'))
          return true;
      }

      if (userAccount.administratorOfs) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const indicator = await GDBIndicatorModel.findOne({_uri: uri});
        if (!indicator)
          throw new Server400Error('No such indicator');

        if (await isReachableBy(indicator, userAccount, 'administratorOfs'))
          return true;
      }
      break;
    case 'createIndicator':
      if (userAccount.isSuperuser){
        return true;
      }

      if (userAccount.editorOfs) {
        // only allowed for the organization they are in userAccount.editorOfs
        // so all organizations in the form must be in userAccount.editorOfs
        const {form} = req.body;
        if (!form || !form.organizations || !form.name || !form.description)
          throw new Server400Error('Invalid input');
        // all organizations must be in userAccount.editorOfs
        const checkerList = form.organizations.map(organizationURI => {
          return organizationBelongsToUser(userAccount, organizationURI, 'editorOfs');
        });
        // if any of organization isn't in userAccount.editorOfs, they doesn't satisfy
        if (!checkerList.includes(false))
          return true;
      }
      // if (userAccount.researcherOfs.length > 0) {
      //   // only allowed for the organization they are in userAccount.researcherOfs
      //   // so all organizations in the form must be in userAccount.editorOfs
      //   const {form} = req.body;
      //   if (!form || !form.organizations || !form.name || !form.description)
      //     throw new Server400Error('Invalid input');
      //   // all organizations must be in userAccount.editorOfs
      //   const checkerList = form.organizations.map(organizationId => {
      //     return organizationBelongsToUser(userAccount, organizationId, 'researcherOfs');
      //   });
      //   // if any of organization isn't in userAccount.editorOfs, they doesn't satisfy
      //   if (!checkerList.includes(false))
      //     return true;
      // }


      break;
    case 'updateIndicator':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.editorOfs) {
        // only allowed for the organization they are in userAccount.editorOfs
        // so all organizations in the form must be in userAccount.editorOfs
        const {form} = req.body;
        if (!form || !form.organizations || !form.name || !form.description)
          throw new Server400Error('Invalid input');
        // all organizations must be in userAccount.editorOfs
        const checkerList = form.organizations.map(organizationURI => {
          return organizationBelongsToUser(userAccount, organizationURI, 'editorOfs');
        });
        // if any of organization isn't in userAccount.editorOfs, they doesn't satisfy
        if (!checkerList.includes(false))
          return true;
      }
      break;



    // outcomes
    case 'fetchOutcomes':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs) {
        // pass if the organization belongs to the group administrated by the groupAdmin
        const {organizationUri} = req.params;
        if (!organizationUri)
          throw new Server400Error('organizationURI is needed');
        if (await organizationBelongsToGroupAdmin(userAccount, organizationUri))
          return true;
      }
      if (userAccount.administratorOfs) {
        // pass if the organization belongs to the userAccount
        const {organizationUri} = req.params;
        if (!organizationUri)
          throw new Server400Error('organizationURI is needed');
        if (await isAPartnerOrganization(organizationUri, userAccount, 'administratorOfs'))
          return true;
      }
      if (userAccount.researcherOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationUri} = req.params;
        if (!organizationUri)
          throw new Server400Error('organizationURI is needed');
        if (await isAPartnerOrganization(organizationUri, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.editorOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationUri} = req.params;
        if (!organizationUri)
          throw new Server400Error('organizationUri is needed');
        if (await isAPartnerOrganization(organizationUri, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.reporterOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationUri} = req.params;
        if (!organizationUri)
          throw new Server400Error('organizationURI is needed');
        if (await isAPartnerOrganization(organizationUri, userAccount, 'reporterOfs'))
          return true;
      }
      break;
    case 'fetchOutcomesThroughTheme':
      return true
      break;
    case 'createOutcome':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.editorOfs) {
        // only allowed for the organization they are in userAccount.editorOfs
        // so all organizations in the form must be in userAccount.editorOfs
        const {form} = req.body;
        if (!form || !form.organization || !form.name || !form.description || !form.themes)
          throw new Server400Error('Invalid input');
        // all organizations must be in userAccount.editorOfs
        if (organizationBelongsToUser(userAccount, form.organization, 'editorOfs'))
          return true;
        // const checkerList = form.organizations.map(organizationUri => {
        //   return organizationBelongsToUser(userAccount, organizationUri, 'editorOfs');
        // });
        // // if any of organization isn't in userAccount.editorOfs, they doesn't satisfy
        // if (!checkerList.includes(false))
        //   return true;
      }
      break;
    case 'fetchOutcome':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs?.length) {
        // check does the outcome belong to an organization belongs to a group belongs to the user

        // fetch the outcome from the database
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');

        // fetch all groups belong to the user
        const groups = await Promise.all(userAccount.groupAdminOfs.map(groupURI => {
            return GDBGroupModel.findOne({_uri: groupURI}, {populates: ['organizations']});
          }
        ));
        for (let group of groups) {
          // fetch all organizations belongs to the group
          group.organizations = await Promise.all(group.organizations.map(organization => {
            return GDBOrganizationModel.findOne({_uri: organization._uri || organization});
          }));
          // check if there any organization contain the outcome
          for (let organization of group.organizations) {
            if (organization.hasOutcomes.includes(uri))
              return true;
          }
        }
      }
      if (userAccount.editorOfs?.length) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const outcome = await GDBOutcomeModel.findOne({_uri: uri});
        if (!outcome)
          throw new Server400Error('No such outcome');

        if (await isReachableBy(outcome, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.researcherOfs?.length) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const outcome = await GDBOutcomeModel.findOne({_uri: uri});
        if (!outcome)
          throw new Server400Error('No such outcome');

        if (await isReachableBy(outcome, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.reporterOfs?.length) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const outcome = await GDBOutcomeModel.findOne({_uri: uri});
        if (!outcome)
          throw new Server400Error('No such outcome');
        if (await isReachableBy(outcome, userAccount, 'reporterOfs'))
          return true;
      }

      if (userAccount.administratorOfs?.length) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const outcome = await GDBOutcomeModel.findOne({_uri: uri});
        if (!outcome)
          throw new Server400Error('No such outcome');

        if (await isReachableBy(outcome, userAccount, 'administratorOfs'))
          return true;
      }
      break;
    case 'updateOutcome':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.editorOfs) {
        // only allowed for the organization they are in userAccount.editorOfs
        // so all organizations in the form must be in userAccount.editorOfs
        const {form} = req.body;
        if (!form || !form.organizations || !form.name || !form.description || !form.theme)
          throw new Server400Error('Invalid input');
        // all organizations must be in userAccount.editorOfs
        const checkerList = form.organizations.map(organizationUri => {
          return organizationBelongsToUser(userAccount, organizationUri, 'editorOfs');
        });
        // if any of organization isn't in userAccount.editorOfs, they doesn't satisfy
        if (!checkerList.includes(false))
          return true;
      }
      break;



    // themes
    case 'fetchTheme': // every one can fetch theme
      return true;
    case 'createTheme': // only superuser can create theme
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'updateTheme': // only superuser can update theme
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'fetchThemes': // every one can fetch theme
      return true;


    case 'createIndicatorReport':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.editorOfs?.length) {
        // only allowed for the organization they are in userAccount.editorOfs
        // so all organizations in the form must be in userAccount.editorOfs
        const {form} = req.body;
        if (!form || !form.name || !form.comment || !form.organization || !form.indicator
          || !form.numericalValue || !form.startTime || !form.endTime || !form.dateCreated)
          throw new Server400Error('Invalid input');
        // the organization must be in userAccount.editorOfs
        if(organizationBelongsToUser(userAccount, form.organization, 'editorOfs'))
          return true

        // const checkerList = form.organizations.map(organizationId => {
        //   return organizationBelongsToUser(userAccount, organizationId, 'editorOfs');
        // });
        // // if any of organization isn't in userAccount.editorOfs, they doesn't satisfy
        // if (!checkerList.includes(false))
        //   return true;
      }

      break;
    case 'fetchIndicatorReport':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs) {
        // check does the IndicatorReport belong to an organization belongs to a group belongs to the user

        // fetch the IndicatorReport from the database
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');

        // fetch all groups belong to the user
        const groups = await Promise.all(userAccount.groupAdminOfs.map(groupURI => {
            return GDBGroupModel.findOne({_uri: groupURI}, {populates: ['organizations']});
          }
        ));
        for (let group of groups) {
          // fetch all organizations belongs to the group
          // group.organizations = await Promise.all(group.organizations.map(organizationURI => {
          //   return GDBOrganizationModel.findOne({_id: organizationURI.split('_')[1]});
          // }));
          // check is there any organization contains the indicatorReport
          for (let organization of group.organizations) {
            if(organization.hasIndicators) {
              organization.hasIndicators = await Promise.all(organization.hasIndicators.map(
                indicatorURI => {
                  return GDBIndicatorModel.findOne({_uri: indicatorURI});
                }
              ));
              for (let indicator of organization.hasIndicators) {
                if (indicator.indicatorReports?.includes(uri))
                  return true;
              }
            }
          }
        }
      }
      if (userAccount.editorOfs?.length) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const indicatorReport = await GDBIndicatorReportModel.findOne({_uri: uri});
        if (!indicatorReport)
          throw new Server400Error('No such indicatorReport');

        if (await isReachableBy(indicatorReport, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.researcherOfs?.length) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const indicatorReport = await GDBIndicatorReportModel.findOne({_uri: uri});
        if (!indicatorReport)
          throw new Server400Error('No such indicator report');

        if (await isReachableBy(indicatorReport, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.reporterOfs?.length) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const indicatorReport = await GDBIndicatorReportModel.findOne({_uri: uri});
        if (!indicatorReport)
          throw new Server400Error('No such indicator report');
        if (await isReachableBy(indicatorReport, userAccount, 'reporterOfs'))
          return true;
      }

      if (userAccount.administratorOfs?.length) {
        const {uri} = req.params;
        if (!uri)
          throw new Server400Error('URI is not given');
        const indicatorReport = await GDBIndicatorReportModel.findOne({_uri: uri});
        if (!indicatorReport)
          throw new Server400Error('No such indicator report');

        if (await isReachableBy(indicatorReport, userAccount, 'administratorOfs'))
          return true;
      }
      break;
    case 'updateIndicatorReport':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.editorOfs?.length) {
        // only allowed for the organization they are in userAccount.editorOfs
        // so all organizations in the form must be in userAccount.editorOfs
        const {form} = req.body;
        if (!form || !form.name || !form.comment || !form.organization || !form.indicator
          || !form.numericalValue || !form.unitOfMeasure || !form.startTime || !form.endTime || !form.dateCreated)
          throw new Server400Error('Invalid input');
        if(organizationBelongsToUser(userAccount, form.organization, 'editorOfs'))
          return true
        // all organizations must be in userAccount.editorOfs
        // const checkerList = form.organizations.map(organizationId => {
        //   return organizationBelongsToUser(userAccount, organizationId, 'editorOfs');
        // });
        // if any of organization isn't in userAccount.editorOfs, they doesn't satisfy
        // if (!checkerList.includes(false))
        //   return true;
      }

      break;
    case 'fetchIndicatorReports':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs?.length) {
        // pass if the organization belongs to the group administrated by the groupAdmin
        const {orgUri} = req.params;
        if (!orgUri)
          throw new Server400Error('organizationURI is needed');
        if (await organizationBelongsToGroupAdmin(userAccount, orgUri))
          return true;
      }
      if (userAccount.administratorOfs?.length) {
        // pass if the organization belongs to the userAccount
        const {orgUri} = req.params;
        if (!orgUri)
          throw new Server400Error('organizationURI is needed');
        if (await isAPartnerOrganization(orgUri, userAccount, 'administratorOfs'))
          return true;
      }
      if (userAccount.researcherOfs?.length) {
        // pass if the organization belongs to any organization which is in the same group
        const {orgUri} = req.params;
        if (!orgUri)
          throw new Server400Error('organizationUri is needed');
        if (await isAPartnerOrganization(orgUri, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.editorOfs?.length) {
        // pass if the organization belongs to any organization which is in the same group
        const {orgUri} = req.params;
        if (!orgUri)
          throw new Server400Error('organizationUri is needed');
        if (await isAPartnerOrganization(orgUri, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.reporterOfs?.length) {
        // pass if the organization belongs to any organization which is in the same group
        const {orgUri} = req.params;
        if (!orgUri)
          throw new Server400Error('organizationUri is needed');
        if (await isAPartnerOrganization(orgUri, userAccount, 'reporterOfs'))
          return true;
      }
      break;


  }

  return false;

}

module.exports = {hasAccess};