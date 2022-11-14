import RadioField from "../components/shared/fields/RadioField";
import { Validator } from "../helpers";
import { defaultField } from "./index";
import SelectField from "../components/shared/fields/SelectField";

export const superuserInvitationFields = {
  email: {
    ...defaultField,
    required: true,
    label: 'Email',
    type: 'email',
    validator: Validator.email,
  },
  // expirationDate: {
  //   ...defaultField,
  //   required: true,
  //   label: 'Expiration date',
  //   type: 'date',
  //   validator: Validator.expirationDate
  // }
};