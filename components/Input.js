import { TextField } from "@material-ui/core";
import { forwardRef } from "react";

export const Input = ({ onChange, value, myRef, ...rest }) => {
  return (
    <TextField
      variant={"outlined"}
      onChange={onChange}
      value={value}
      ref={myRef}
      {...rest}
    />
  );
};

export default forwardRef(Input);
