import React from 'react';

export const defaultUserContext = {
  id:'',
  givenName:'',
  familyName:'',
  email: '',
  errorMessage:[],
}

export const getUserContext = () => {
  const context = {...defaultUserContext};
  const json = localStorage.getItem('userContext');

  if (json) {
    Object.assign(context, JSON.parse(json));
  }
  return context;
}

export const UserContext = React.createContext(defaultUserContext);
