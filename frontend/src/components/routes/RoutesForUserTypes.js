import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from "../../context";

export function SuperUserRoute({element: Component, ...rest}) {
  const userContext = useContext(UserContext);
  const navigate = useNavigate();
  if (userContext.userType === 'superuser') {
    return <Component {...rest}/>;
  }

  navigate('/login-pane');
  return '';
}

