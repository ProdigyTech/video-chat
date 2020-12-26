import { Button as MaterialButton } from "@material-ui/core";

export const Button = ({ children, ...rest }) => {
  return <MaterialButton {...rest}> {children} </MaterialButton>;
};
