import React from 'react';
import {Route, Routes} from 'react-router-dom';

// components
import Landing from './components/Landing';
import LoginPane from './components/login/LoginPane';
import Dashboard from './components/dashboard/Dashboard';
import changePrimaryEmail from './components/userProfile/changePrimaryEmail';
import Users from './components/users/Users';
import User from './components/users/User';
import UserForm from './components/users/UserForm';
import UserInvite from './components/registration/UserInvite';
import ResetPassword from './components/userProfile/UserResetPassword';
import UserResetSecurityQuestions from "./components/userProfile/UserResetSecurityQuestions";
import EmailConfirm from './components/emailConfirm';
import UserProfile from './components/userProfile/Profile';
import UpdateUserProfile from './components/userProfile/EditProfile';
import PrivateRoute from './components/routes/PrivateRoute';
import {SuperUserRoute} from './components/routes/RoutesForUserTypes';
import UserFirstEntry from "./components/registration/UserFirstEntry";
import ForgotPassword from "./components/forgotPassword/ForgotPassword";
import ForgotPasswordResetPassword from "./components/forgotPassword/ResetPassword";
import DoubleAuth from "./components/login/DoubleAuth";
import Organizations from "./components/organizations/Organizations";
import AddEditOrganization from "./components/organizations/AddEditOrganization";
import EditUserForm from "./components/users/EditUserForm";
import Groups from "./components/groups/Groups";
import AddEditGroup from "./components/groups/AddEditGroup";
import Profile from "./components/userProfile/Profile";
import Themes from "./components/theme/Themes";
import AddEditTheme from "./components/theme/addEditTheme";
import Organization_indicators from "./components/indicators/Organization-indicators";
import Indicators from "./components/indicators/Indicators";
import AddEditIndicator from "./components/indicators/addEditIndicator";
import Organization_outcomes from "./components/outcomes/Organization-outcomes";
import Outcomes from "./components/outcomes/outcomes";
import AddEditOutcome from "./components/outcomes/AddEditOutcome";
import AddEditIndicatorReport from "./components/indicatorReport/AddEditIndicatorReport";
import Organization_indicatorReports from "./components/indicatorReport/Organization-indicatorReports";
import IndicatorReports from "./components/indicatorReport/indicatorReports";
import FileUploadingPage from "./components/uploadingPages/uploadingPage";

const routes = (
  <Routes>
    {/*basic*/}
    <Route exact path="/" element={<Landing/>}/>
    <Route path="/login/doubleAuth" element={<DoubleAuth/>}/>
    <Route path="/login" element={<LoginPane/>}/>
    <Route path="/dashboard" element={<PrivateRoute element={Dashboard}/>}/>
    <Route path="/verify/:token" element={<UserFirstEntry/>}/>}/>
    <Route path="/forgot-password" element={<ForgotPassword/>}/>
    {/*users*/}
    <Route path="/users" element={<PrivateRoute element={Users}/>}/>
    <Route path="/users/invite" element={<PrivateRoute element={UserInvite}/>}/>
    <Route path="/users/:uri/edit" element={<PrivateRoute element={UpdateUserProfile}/>}/>
    <Route path="/users/:uri" element={<PrivateRoute element={EditUserForm}/>}/>

    {/*organization*/}
    <Route path="/organizations" element={<PrivateRoute element={Organizations}/>}/>
    <Route path="/organizations/new" element={<PrivateRoute element={AddEditOrganization}/>}/>
    <Route path="/organizations/:uri/edit" element={<PrivateRoute element={AddEditOrganization}/>}/>
    {/*Groups*/}
    <Route path="/groups" element={<PrivateRoute element={Groups}/>}/>
    <Route path="/groups/new" element={<PrivateRoute element={AddEditGroup}/>}/>
    <Route path="/groups/:uri/edit" element={<PrivateRoute element={AddEditGroup}/>}/>
    {/*profile*/}
    <Route path="/profile/:id/edit" element={<PrivateRoute element={UpdateUserProfile}/>}/>
    <Route path="/profile/:id" element={<PrivateRoute element={UserProfile}/>}/>
    <Route path="/profile/reset-password/:id" element={<PrivateRoute element={ResetPassword}/>}/>
    <Route path="/profile/reset-securityQuestions/:id" element={<PrivateRoute element={UserResetSecurityQuestions}/>}/>
    {/*theme*/}
    <Route path="/themes" element={<PrivateRoute element={Themes}/>}/>
    <Route path="/themes/new" element={<PrivateRoute element={AddEditTheme}/>}/>
    <Route path="/themes/:id/:operationMode" element={<PrivateRoute element={AddEditTheme}/>}/>
    {/*indicators*/}
    <Route path="/organization-indicators" element={<PrivateRoute element={Organization_indicators}/>}/>
    <Route path="/indicators/:id" element={<PrivateRoute element={Indicators}/>}/>
    <Route path="/indicator/:orgId/new" element={<PrivateRoute element={AddEditIndicator}/>}/>
    <Route path="/indicator/new" element={<PrivateRoute element={AddEditIndicator}/>}/>
    <Route path="/indicator/:id/:operationMode" element={<PrivateRoute element={AddEditIndicator}/>}/>
    {/*outcomes*/}
    <Route path="/organization-outcomes" element={<PrivateRoute element={Organization_outcomes}/>}/>
    <Route path="/outcomes/:id" element={<PrivateRoute element={Outcomes}/>}/>
    <Route path="/outcome/:orgId/new" element={<PrivateRoute element={AddEditOutcome}/>}/>
    <Route path="/outcome/new" element={<PrivateRoute element={AddEditOutcome}/>}/>
    <Route path="/outcome/:id/:operationMode" element={<PrivateRoute element={AddEditOutcome}/>}/>
      {/*file uploading page*/}
    <Route path="/fileUploading" element={<PrivateRoute element={FileUploadingPage}/>}/>
    <Route path="/fileUploading/:orgID/:fileType" element={<PrivateRoute element={FileUploadingPage}/>}/>


    <Route path="/organization-indicatorReports" element={<PrivateRoute element={Organization_indicatorReports}/>}/>
    <Route path="/indicatorReports/:id" element={<PrivateRoute element={IndicatorReports}/>}/>
    <Route path="/indicatorReport/new" element={<PrivateRoute element={AddEditIndicatorReport}/>}/>
    <Route path="/indicatorReport/:orgId/new" element={<PrivateRoute element={AddEditIndicatorReport}/>}/>
    <Route path="/indicatorReport/:id/:operationMode" element={<PrivateRoute element={AddEditIndicatorReport}/>}/>


    <Route path="/email-confirm" element={<EmailConfirm/>}/>

    <Route path="/update-primary-email/:token" element={<changePrimaryEmail/>}/>

    <Route path="/resetPassword/:token" element={<PrivateRoute element={ForgotPasswordResetPassword}/>}/>


    <Route path="/users/reset-securityQuestions/:id" element={<PrivateRoute element={UserResetSecurityQuestions}/>}/>


    <Route path="/users/new" element={<SuperUserRoute element={UserForm}/>}/>

    <Route path="/users/:id" element={<SuperUserRoute element={User}/>}/>

    {/*<Route path="/admin-logs" element={<SuperUserRoute element={AdminLogs}/>}/>*/}


    {/*<Route path="/providers/:id/rate" element={<PrivateRoute element={ProviderRatingForm}/>}/>*/}
    {/*<Route path="/providers/new/add-service" element={<PrivateRoute element={AddServicePrompt}/>}/>*/}
    {/*<Route path="/providers/:formType/new" element={<PrivateRoute element={ProviderForm}/>}/>*/}
    {/*<Route path="/providers/:formType/:id" element={<PrivateRoute element={VisualizeServiceProvider}/>}/>*/}
    {/*<Route path="/providers/:formType/:id/edit/" element={<PrivateRoute element={ProviderForm}/>}/>*/}
    {/*<Route path="/providers/:id" element={<PrivateRoute element={ProviderProfile}/>}/>*/}
    {/*<Route path="/providers" element={<PrivateRoute element={Providers}/>}/>*/}

    {/*<Route path="/services/:id/edit" element={<PrivateRoute element={ServiceForm}/>}/>*/}
    {/*<Route path="/services/new" element={<PrivateRoute element={ServiceForm}/>}/>*/}
    {/*<Route path="/services/:id" element={<PrivateRoute element={VisualizeService}/>}/>*/}
    {/*<Route path="/services" element={<PrivateRoute element={Services}/>}/>*/}

    {/*<Route path="/serviceOccurrences" element={<PrivateRoute element={ServiceOccurrences}/>}/>*/}
    {/*<Route path="/serviceOccurrence/new" element={<PrivateRoute element={ServiceOccurrenceForm}/>}/>*/}
    {/*<Route path="/serviceOccurrence/:id/edit" element={<PrivateRoute element={ServiceOccurrenceForm}/>}/>*/}

    {/*<Route path="/referrals" element={<PrivateRoute element={Referrals}/>}/>*/}

    {/*<Route path="/appointments/:id/edit" element={<PrivateRoute element={AppointmentForm}/>}/>*/}
    {/*<Route path="/appointments/:id" element={<PrivateRoute element={VisualizeAppointment}/>}/>*/}
    {/*<Route path="/appointments/new" element={<PrivateRoute element={AppointmentForm}/>}/>*/}
    {/*<Route path="/appointments" element={<PrivateRoute element={Appointments}/>}/>*/}

    {/*<Route path="/eligibility-criteria" element={<PrivateRoute element={Eligibilities}/>}/>*/}

    {/*<Route path="/characteristics" element={<AdminRoute element={Characteristics}/>}/>*/}
    {/*/!*this for edit*!/*/}
    {/*<Route path={'/characteristic/:id/:option'} element={<AdminRoute element={AddEditCharacteristic}/>}/>*/}
    {/*/!*this for add  *!/*/}
    {/*<Route path={'/characteristic/:option'} element={<AdminRoute element={AddEditCharacteristic}/>}/>*/}

    {/*<Route path={'/question/:id/:option'} element={<AdminRoute element={AddEditQuestion}/>}/>*/}
    {/*<Route path={'/question/:option'} element={<AdminRoute element={AddEditQuestion}/>}/>*/}
    {/*<Route path={'/questions'} element={<AdminRoute element={Questions}/>}/>*/}

    {/*<Route path={'/need/:id/:option'} element={<AdminRoute element={AddEditNeed}/>}/>*/}
    {/*<Route path={'/need/:option'} element={<AdminRoute element={AddEditNeed}/>}/>*/}
    {/*<Route path={'/needs'} element={<AdminRoute element={Needs}/>}/>*/}

    {/*<Route path={'/needSatisfier/:id/:option'} element={<AdminRoute element={AddEditNeedSatisfier}/>}/>*/}
    {/*<Route path={'/needSatisfier/:option'} element={<AdminRoute element={AddEditNeedSatisfier}/>}/>*/}
    {/*<Route path={'/needSatisfiers'} element={<AdminRoute element={NeedSatisfiers}/>}/>*/}


    {/*<Route path="/settings/manage-fields" element={<AdminRoute element={ManageFields}/>}/>*/}

    {/*<Route exact path="/settings/manage-forms/" element={<AdminRoute element={ManageForms}/>}/>*/}
    {/*<Route exact path="/settings/manage-forms/:formType" element={<AdminRoute element={ManageForms}/>}/>*/}

    {/*/!*:formType could be `client`, 'organization', ...*!/*/}
    {/*/!*:method could be `edit` or `new`*!/*/}
    {/*<Route exact path="/settings/forms/" element={<AdminRoute element={ManageFormFields}/>}/>*/}
    {/*<Route exact path="/settings/forms/:formType/:method" element={<AdminRoute element={ManageFormFields}/>}/>*/}
    {/*<Route exact path="/settings/forms/:formType/:method/:formId" element={<AdminRoute element={ManageFormFields}/>}/>*/}
  </Routes>
);

export default routes;
