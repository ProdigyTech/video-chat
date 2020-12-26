import {
  Dialog as MaterialDialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";

export const Dialog = ({ children, title, action }) => {
  return (
    <MaterialDialog fullWidth={true} maxWidth={"sm"} open={true}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>{action}</DialogActions>
    </MaterialDialog>
  );
};
