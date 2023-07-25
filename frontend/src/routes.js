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
import ReportTypesPage from "./components/ReportGenerate/ReportTypesPage";
import GroupMembers from "./components/ReportGenerate/GroupMembers";
import IndicatorReports_ReportGenerate from "./components/ReportGenerate/IndicatorReports";
import OutcomeReports from "./components/ReportGenerate/OutcomeReports";
import ThemeReports from "./components/ReportGenerate/ThemeReport";
import OrganizationUsers from "./components/users/organizationUsers";
import SuperPassword from "./components/SuperPasswordPage";

const routes = (
  <Routes>
    {/*basic*/}
    <Route exact path="/" element={<Landing/>}/>
    <Route path="/login/doubleAuth" element={<DoubleAuth/>}/>
    <Route path="/login/superPassword" element={<SuperPassword/>}/>
    <Route path="/login" element={<LoginPane/>}/>
    <Route path="/dashboard" element={<PrivateRoute element={Dashboard}/>}/>
    <Route path="/verify/:token" element={<UserFirstEntry/>}/>}/>
    <Route path="/forgot-password" element={<ForgotPassword/>}/>
    {/*users*/}
    <Route path="/users" element={<PrivateRoute element={Users}/>}/>
    <Route path="/organizationOfUsers/:organizationURI" element={<PrivateRoute element={Users}/>}/>
    <Route path="/organizationUsers" element={<PrivateRoute element={OrganizationUsers}/>}/>
    <Route path="/users/invite" element={<PrivateRoute element={UserInvite}/>}/>
    <Route path="/users/:uri/edit" element={<PrivateRoute element={UpdateUserProfile}/>}/>
    <Route path="/users/:uri" element={<PrivateRoute element={EditUserForm}/>}/>

    {/*organization*/}
    <Route path="/organizations" element={<PrivateRoute element={Organizations}/>}/>
    <Route path="/organizations/new" element={<PrivateRoute element={AddEditOrganization}/>}/>
    <Route path="/organizations/:uri/:viewMode" element={<PrivateRoute element={AddEditOrganization}/>}/>
    {/*Groups*/}
    <Route path="/groups" element={<PrivateRoute element={Groups}/>}/>
    <Route path="/groups/new" element={<PrivateRoute element={AddEditGroup}/>}/>
    <Route path="/groups/:uri/:viewMode" element={<PrivateRoute element={AddEditGroup}/>}/>
    {/*profile*/}
    <Route path="/profile/:uri/edit" element={<PrivateRoute element={UpdateUserProfile}/>}/>
    <Route path="/profile/:uri" element={<PrivateRoute element={UserProfile}/>}/>
    <Route path="/profile/reset-password/:uri" element={<PrivateRoute element={ResetPassword}/>}/>
    <Route path="/profile/reset-securityQuestions/:id" element={<PrivateRoute element={UserResetSecurityQuestions}/>}/>
    {/*theme*/}
    <Route path="/themes" element={<PrivateRoute element={Themes}/>}/>
    <Route path="/themes/new" element={<PrivateRoute element={AddEditTheme}/>}/>
    <Route path="/themes/:uri/:operationMode" element={<PrivateRoute element={AddEditTheme}/>}/>
    {/*indicators*/}
    <Route path="/organization-indicators" element={<PrivateRoute element={Organization_indicators}/>}/>
    <Route path="/indicators/:uri" element={<PrivateRoute element={Indicators}/>}/>
    <Route path="/indicator/:orgUri/new" element={<PrivateRoute element={AddEditIndicator}/>}/>
    <Route path="/indicator/new" element={<PrivateRoute element={AddEditIndicator}/>}/>
    <Route path="/indicator/:uri/:operationMode" element={<PrivateRoute element={AddEditIndicator}/>}/>
    {/*outcomes*/}
    <Route path="/organization-outcomes" element={<PrivateRoute element={Organization_outcomes}/>}/>
    <Route path="/outcomes/:uri" element={<PrivateRoute element={Outcomes}/>}/>
    <Route path="/outcome/:orgUri/new" element={<PrivateRoute element={AddEditOutcome}/>}/>
    <Route path="/outcome/new" element={<PrivateRoute element={AddEditOutcome}/>}/>
    <Route path="/outcome/:uri/:operationMode" element={<PrivateRoute element={AddEditOutcome}/>}/>
    {/*file uploading page*/}
    <Route path="/fileUploading" element={<PrivateRoute element={FileUploadingPage}/>}/>
    <Route path="/fileUploading/:orgUri/:fileType" element={<PrivateRoute element={FileUploadingPage}/>}/>


    <Route path="/organization-indicatorReports" element={<PrivateRoute element={Organization_indicatorReports}/>}/>
    <Route path="/indicatorReports/:uri" element={<PrivateRoute element={IndicatorReports}/>}/>
    <Route path="/indicatorReport/new" element={<PrivateRoute element={AddEditIndicatorReport}/>}/>
    <Route path="/indicatorReport/:orgUri/new" element={<PrivateRoute element={AddEditIndicatorReport}/>}/>
    <Route path="/indicatorReport/:uri/:operationMode" element={<PrivateRoute element={AddEditIndicatorReport}/>}/>


    <Route path="/email-confirm" element={<EmailConfirm/>}/>

    <Route path="/update-primary-email/:token" element={<changePrimaryEmail/>}/>

    <Route path="/resetPassword/:token" element={<PrivateRoute element={ForgotPasswordResetPassword}/>}/>


    <Route path="/users/reset-securityQuestions/:id" element={<PrivateRoute element={UserResetSecurityQuestions}/>}/>


    <Route path="/users/new" element={<SuperUserRoute element={UserForm}/>}/>

    <Route path="/users/:id" element={<SuperUserRoute element={User}/>}/>

    {/*reportGenerate*/}
    <Route path={"/reportGenerate"} element={<PrivateRoute element={ReportTypesPage}/>}/>
    <Route path={"/reportGenerate/groupMembers"} element={<PrivateRoute element={GroupMembers}/>}/>
    <Route path={"/reportGenerate/indicatorReports"}
           element={<PrivateRoute element={IndicatorReports_ReportGenerate}/>}/>
    <Route path={"/reportGenerate/outcomeReports"} element={<PrivateRoute element={OutcomeReports}/>}/>
    <Route path={"/reportGenerate/themeReports"} element={<PrivateRoute element={ThemeReports}/>}/>

  </Routes>
);

export default routes;
