import { TextField } from "@material-ui/core";
import { forwardRef } from "react";

export const Input = forwardRef(
  ({ onChange, value, myRef, children, ...rest }, ref) => {
    return (
      <>
        <TextField
          variant={"outlined"}
          onChange={onChange}
          value={value}
          ref={ref}
          {...rest}
        />
        {children}
      </>
    );
  }
);
