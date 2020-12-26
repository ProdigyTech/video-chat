import { TextField } from "@material-ui/core";

export const Input = ({ onChange, value, ...rest }) => {
  return (
    <TextField
      variant={"outlined"}
      onChange={onChange}
      value={value}
      {...rest}
    />
  );
};
