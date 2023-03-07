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
  const userAccount = await GDBUserAccountModel.findOne({_id: req.session._id});
  if (!userAccount)
    throw new Server400Error('Wrong auth');
  switch (operationType) {
    case 'reportFrontendError':
      return true;

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

    // organizations
    case 'createOrganization':
      return userAccount.isSuperuser;
    case 'updateOrganization':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.administratorOfs) {

        const organizationId = req.params.id;
        const form = req.body.form;
        // firstly check is the user administrating the organization
        if (organizationBelongsToUser(userAccount, organizationId, 'administratorOfs')) {
          // then check is the user updating the restricted properties
          const organization = await GDBOrganizationModel.findOne({_id: organizationId}, {populates: ['hasId']});
          if (organization.administrator.split('_')[1] === form.administrator && organization.legalName === form.legalName
          && organization.hasId.hasIdentifier === form.ID)
            return true;
        }
      }
      break;
    case 'fetchOrganization':
      if (userAccount.isSuperuser)
        return true;

      // check if the userAccount is associated with the organization
      const organizationId = req.params.id;
      const organizations = await allReachableOrganizations(userAccount);
      const checkerList = organizations.filter(organization => organization._id === organizationId);
      if (checkerList.length)
        return true;

      break;
    case 'fetchOrganizations':
      // every users should be able to fetch organizations,
      // however, the ret they got are different depends on their role
      return true;
      break;

    // groups
    case 'fetchGroups':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs)
        return true;
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
        const {id} = req.params;
        const form = req.body;
        if (!id || !form)
          throw new Server400Error('Invalid input')
        const group = await GDBGroupModel.findOne({_id:id})
        if (!group)
          throw new Server400Error('No such group')
        if (form.label === group.label && form.administrator === group.administrator.split('_')[1]){
          // label and administrator cannot be changed
          const previousOrganizationIds = group.organizations.map(organizationURI => organizationURI.split('_')[1])
          const checkerList = form.organizations.map(organizationId => {
            return previousOrganizationIds.includes(organizationId)
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
        const {id} = req.params;
        if (userAccount.groupAdminOfs.includes(`:group_${id}`))
          return true;
      }
      break;


    // users
    case 'fetchUsers':
      return true;

    // indicators
    case 'fetchIndicators':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs) {
        // pass if the organization belongs to the group administrated by the groupAdmin
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (await organizationBelongsToGroupAdmin(userAccount, organizationId))
          return true;
      }
      // fetch all groups belong to the user
      //   const groups = await Promise.all(userAccount.groupAdminOfs.map(groupURI => {
      //       return GDBGroupModel.findOne({_id: groupURI.split('_')[1]}, {populates: ['organizations']});
      //     }
      //   ));
      //   // check does there any group contain the organization with organizationId
      //   const checker = groups.filter(group => {
      //     return group.organizations.includes(`:organization_${organizationId}`);
      //   });
      //   if (checker.length > 0)
      //     return true;
      // }
      if (userAccount.administratorOfs) {
        // pass if the organization belongs to the userAccount
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (organizationBelongsToUser(userAccount, organizationId, 'administratorOfs'))
          return true;
      }
      if (userAccount.researcherOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (await isAPartnerOrganization(organizationId, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.editorOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (await isAPartnerOrganization(organizationId, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.reporterOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (await isAPartnerOrganization(organizationId, userAccount, 'reporterOfs'))
          return true;
      }

      break;
    case 'fetchIndicator':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs?.length > 0) {
        // check does the indicator belong to an organization belongs to a group belongs to the user

        // fetch the indicator from the database
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');

        // fetch all groups belong to the user
        const groups = await Promise.all(userAccount.groupAdminOfs.map(groupURI => {
            return GDBGroupModel.findOne({_id: groupURI.split('_')[1]}, {populates: ['organizations']});
          }
        ));
        for (let group of groups) {
          // fetch all organizations belongs to the group
          // group.organizations = await Promise.all(group.organizations.map(organizationURI => {
          //   return GDBOrganizationModel.findOne({_id: organizationURI.split('_')[1]});
          // }));
          // check if there any organization contain the indicator
          for (let organization of group.organizations) {
            if (organization.hasIndicators.includes(`:indicator_${id}`))
              return true;
          }
        }
      }
      if (userAccount.editorOfs) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const indicator = await GDBIndicatorModel.findOne({_id: id});
        if (!indicator)
          throw new Server400Error('No such indicator');

        if (await isReachableBy(indicator, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.researcherOfs) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const indicator = await GDBIndicatorModel.findOne({_id: id});
        if (!indicator)
          throw new Server400Error('No such indicator');

        if (await isReachableBy(indicator, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.reporterOfs) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const indicator = await GDBIndicatorModel.findOne({_id: id});
        if (!indicator)
          throw new Server400Error('No such indicator');
        if (await isReachableBy(indicator, userAccount, 'reporterOfs'))
          return true;
      }

      if (userAccount.administratorOfs) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const indicator = await GDBIndicatorModel.findOne({_id: id});
        if (!indicator)
          throw new Server400Error('No such indicator');

        if (await isReachableBy(indicator, userAccount, 'administratorOfs'))
          return true;
      }
      break;
    case 'createIndicator':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.editorOfs) {
        // only allowed for the organization they are in userAccount.editorOfs
        // so all organizations in the form must be in userAccount.editorOfs
        const {form} = req.body;
        if (!form || !form.organizations || !form.name || !form.description)
          throw new Server400Error('Invalid input');
        // all organizations must be in userAccount.editorOfs
        const checkerList = form.organizations.map(organizationId => {
          return organizationBelongsToUser(userAccount, organizationId, 'editorOfs');
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
        const checkerList = form.organizations.map(organizationId => {
          return organizationBelongsToUser(userAccount, organizationId, 'editorOfs');
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
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (await organizationBelongsToGroupAdmin(userAccount, organizationId))
          return true;
      }
      if (userAccount.administratorOfs) {
        // pass if the organization belongs to the userAccount
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (organizationBelongsToUser(userAccount, organizationId, 'administratorOfs'))
          return true;
      }
      if (userAccount.researcherOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (await isAPartnerOrganization(organizationId, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.editorOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (await isAPartnerOrganization(organizationId, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.reporterOfs) {
        // pass if the organization belongs to any organization which is in the same group
        const {organizationId} = req.params;
        if (!organizationId)
          throw new Server400Error('organizationId is needed');
        if (await isAPartnerOrganization(organizationId, userAccount, 'reporterOfs'))
          return true;
      }
      break;
    case 'createOutcome':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.editorOfs) {
        // only allowed for the organization they are in userAccount.editorOfs
        // so all organizations in the form must be in userAccount.editorOfs
        const {form} = req.body;
        if (!form || !form.organizations || !form.name || !form.description || !form.domain)
          throw new Server400Error('Invalid input');
        // all organizations must be in userAccount.editorOfs
        const checkerList = form.organizations.map(organizationId => {
          return organizationBelongsToUser(userAccount, organizationId, 'editorOfs');
        });
        // if any of organization isn't in userAccount.editorOfs, they doesn't satisfy
        if (!checkerList.includes(false))
          return true;
      }


      break;
    case 'fetchOutcome':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.groupAdminOfs.length) {
        // check does the outcome belong to an organization belongs to a group belongs to the user

        // fetch the outcome from the database
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');

        // fetch all groups belong to the user
        const groups = await Promise.all(userAccount.groupAdminOfs.map(groupURI => {
            return GDBGroupModel.findOne({_id: groupURI.split('_')[1]}, {populates: ['organizations']});
          }
        ));
        for (let group of groups) {
          // fetch all organizations belongs to the group
          group.organizations = await Promise.all(group.organizations.map(organizationURI => {
            return GDBOrganizationModel.findOne({_id: organizationURI.split('_')[1]});
          }));
          // check if there any organization contain the outcome
          for (let organization of group.organizations) {
            if (organization.hasOutcomes.includes(`:outcome_${id}`))
              return true;
          }
        }
      }
      if (userAccount.editorOfs.length) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const outcome = await GDBOutcomeModel.findOne({_id: id});
        if (!outcome)
          throw new Server400Error('No such outcome');

        if (await isReachableBy(outcome, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.researcherOfs.length) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const outcome = await GDBOutcomeModel.findOne({_id: id});
        if (!outcome)
          throw new Server400Error('No such outcome');

        if (await isReachableBy(outcome, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.reporterOfs.length) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const outcome = await GDBOutcomeModel.findOne({_id: id});
        if (!outcome)
          throw new Server400Error('No such outcome');
        if (await isReachableBy(outcome, userAccount, 'reporterOfs'))
          return true;
      }

      if (userAccount.administratorOfs.length) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const outcome = await GDBOutcomeModel.findOne({_id: id});
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
        if (!form || !form.organizations || !form.name || !form.description || !form.domain)
          throw new Server400Error('Invalid input');
        // all organizations must be in userAccount.editorOfs
        const checkerList = form.organizations.map(organizationId => {
          return organizationBelongsToUser(userAccount, organizationId, 'editorOfs');
        });
        // if any of organization isn't in userAccount.editorOfs, they doesn't satisfy
        if (!checkerList.includes(false))
          return true;
      }
      break;



    // domains
    case 'fetchDomain': // every one can fetch domain
      return true;
    case 'createDomain': // only superuser can create domain
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'updateDomain': // only superuser can update domain
      if (userAccount.isSuperuser)
        return true;
      break;
    case 'fetchDomains': // every one can fetch domain
      return true;


    case 'createIndicatorReport':
      if (userAccount.isSuperuser)
        return true;
      if (userAccount.editorOfs?.length) {
        // only allowed for the organization they are in userAccount.editorOfs
        // so all organizations in the form must be in userAccount.editorOfs
        const {form} = req.body;
        if (!form || !form.name || !form.comment || !form.organization || !form.indicator
          || !form.numericalValue || !form.unitOfMeasure || !form.startTime || !form.endTime || !form.dateCreated)
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
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');

        // fetch all groups belong to the user
        const groups = await Promise.all(userAccount.groupAdminOfs.map(groupURI => {
            return GDBGroupModel.findOne({_id: groupURI.split('_')[1]}, {populates: ['organizations']});
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
                  return GDBIndicatorModel.findOne({_id: indicatorURI.split('_')[1]});
                }
              ));
              for (let indicator of organization.hasIndicators) {
                if (indicator.indicatorReports?.includes(`:indicatorReport_${id}`))
                  return true;
              }
            }
          }
        }
      }
      if (userAccount.editorOfs?.length) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const indicatorReport = await GDBIndicatorReportModel.findOne({_id: id});
        if (!indicatorReport)
          throw new Server400Error('No such indicatorReport');

        if (await isReachableBy(indicatorReport, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.researcherOfs?.length) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const indicatorReport = await GDBIndicatorReportModel.findOne({_id: id});
        if (!indicatorReport)
          throw new Server400Error('No such indicator report');

        if (await isReachableBy(indicatorReport, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.reporterOfs?.length) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const indicatorReport = await GDBIndicatorReportModel.findOne({_id: id});
        if (!indicatorReport)
          throw new Server400Error('No such indicator report');
        if (await isReachableBy(indicatorReport, userAccount, 'reporterOfs'))
          return true;
      }

      if (userAccount.administratorOfs?.length) {
        const {id} = req.params;
        if (!id)
          throw new Server400Error('Id is not given');
        const indicatorReport = await GDBIndicatorReportModel.findOne({_id: id});
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
        const {orgId} = req.params;
        if (!orgId)
          throw new Server400Error('organizationId is needed');
        if (await organizationBelongsToGroupAdmin(userAccount, orgId))
          return true;
      }
      if (userAccount.administratorOfs?.length) {
        // pass if the organization belongs to the userAccount
        const {orgId} = req.params;
        if (!orgId)
          throw new Server400Error('organizationId is needed');
        if (organizationBelongsToUser(userAccount, orgId, 'administratorOfs'))
          return true;
      }
      if (userAccount.researcherOfs?.length) {
        // pass if the organization belongs to any organization which is in the same group
        const {orgId} = req.params;
        if (!orgId)
          throw new Server400Error('organizationId is needed');
        if (await isAPartnerOrganization(orgId, userAccount, 'researcherOfs'))
          return true;
      }

      if (userAccount.editorOfs?.length) {
        // pass if the organization belongs to any organization which is in the same group
        const {orgId} = req.params;
        if (!orgId)
          throw new Server400Error('organizationId is needed');
        if (await isAPartnerOrganization(orgId, userAccount, 'editorOfs'))
          return true;
      }

      if (userAccount.reporterOfs?.length) {
        // pass if the organization belongs to any organization which is in the same group
        const {orgId} = req.params;
        if (!orgId)
          throw new Server400Error('organizationId is needed');
        if (await isAPartnerOrganization(orgId, userAccount, 'reporterOfs'))
          return true;
      }
      break;


  }

  return false;

}

module.exports = {hasAccess};